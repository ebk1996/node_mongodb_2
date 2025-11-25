const connect = require('./db');
const { ObjectId } = require('mongodb');
const chalk = require('chalk');
const inquirer = require('inquirer');

async function run() {
  let client;
  try {
    const conn = await connect();
    const db = conn.db;
    client = conn.client;

    const movies = db.collection('movies');
    const users = db.collection('users');
    const comments = db.collection('comments');

    // Inquirer prompt example
    const inquirer = require('inquirer');
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'movieTitle',
        message: 'Enter a movie title to search:',
      }
    ]);
    console.log('You entered:', answers.movieTitle);

    const operations = [
      'Create User',
      'Read Movies',
      'Update Movies',
      'Delete Data',
      'Aggregate Movies',
      'Exit'
    ];

    let exit = false;
    while (!exit) {
      const { choice } = await inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: 'Select an operation:',
        choices: operations
      }]);

      switch (choice) {
        case 'Create User':
          console.log(chalk.blue('\n=== CREATE USER ==='));
          const { name, email } = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Enter name:' },
            { type: 'input', name: 'email', message: 'Enter email:' }
          ]);
          const userInsert = await users.insertOne({ name, email });
          console.log(chalk.green(`User inserted with ID: ${userInsert.insertedId}`));
          break;

        case 'Read Movies':
          const readOps = [
            'Movies by Christopher Nolan',
            'Action movies sorted by year',
            'IMDb > 8 movies',
            'Movies with Tom Hanks & Tim Allen',
            'Movies only with Tom Hanks & Tim Allen',
            'Comedy movies by Spielberg',
            'Back'
          ];
          const { readChoice } = await inquirer.prompt([{
            type: 'list',
            name: 'readChoice',
            message: 'Select a read operation:',
            choices: readOps
          }]);
          switch (readChoice) {
            case 'Movies by Christopher Nolan':
              const nolan = await movies.find({ director: 'Christopher Nolan' }).toArray();
              console.table(nolan.map(m => ({ Title: m.title, Year: m.year })));
              break;
            case 'Action movies sorted by year':
              const actionMovies = await movies.find({ genres: 'Action' }).sort({ year: -1 }).toArray();
              console.table(actionMovies.map(m => ({ Title: m.title, Year: m.year })));
              break;
            case 'IMDb > 8 movies':
              const highRated = await movies.find({ 'imdb.rating': { $gt: 8 } })
                .project({ title: 1, imdb: 1 })
                .toArray();
              console.table(highRated.map(m => ({ Title: m.title, IMDb: m.imdb.rating, Votes: m.imdb.votes })));
              break;
            case 'Movies with Tom Hanks & Tim Allen':
              const bothActors = await movies.find({ cast: { $all: ['Tom Hanks', 'Tim Allen'] } }).toArray();
              console.table(bothActors.map(m => ({ Title: m.title, Year: m.year })));
              break;
            case 'Movies only with Tom Hanks & Tim Allen':
              const onlyActors = await movies.find({
                cast: { $all: ['Tom Hanks', 'Tim Allen'] },
                $expr: { $eq: [{ $size: '$cast' }, 2] }
              }).toArray();
              console.table(onlyActors.map(m => ({ Title: m.title, Year: m.year })));
              break;
            case 'Comedy movies by Spielberg':
              const spielbergComedies = await movies.find({ director: 'Steven Spielberg', genres: 'Comedy' }).toArray();
              console.table(spielbergComedies.map(m => ({ Title: m.title, Year: m.year })));
              break;
            case 'Back':
              break;
          }
          break;

        case 'Update Movies':
          const updateOps = [
            'Add available_on to The Matrix',
            'Increment Metacritic of The Matrix',
            'Add genre "Gen Z" to 1997 movies',
            'Increase IMDb rating <5',
            'Back'
          ];
          const { updateChoice } = await inquirer.prompt([{
            type: 'list',
            name: 'updateChoice',
            message: 'Select an update operation:',
            choices: updateOps
          }]);
          const matrixMovie = await movies.findOne({ title: 'The Matrix' });
          switch (updateChoice) {
            case 'Add available_on to The Matrix':
              if (matrixMovie) {
                await movies.updateOne({ _id: matrixMovie._id }, { $set: { available_on: 'Sflix' } });
                console.log(chalk.green('Updated The Matrix with available_on: Sflix'));
              }
              break;
            case 'Increment Metacritic of The Matrix':
              if (matrixMovie) {
                await movies.updateOne({ _id: matrixMovie._id }, { $inc: { metacritic: 1 } });
                console.log(chalk.green('Incremented Metacritic for The Matrix'));
              }
              break;
            case 'Add genre "Gen Z" to 1997 movies':
              const addGenZ = await movies.updateMany({ year: 1997 }, { $addToSet: { genres: 'Gen Z' } });
              console.log(chalk.green(`Updated ${addGenZ.modifiedCount} movies`));
              break;
            case 'Increase IMDb rating <5':
              const incLow = await movies.updateMany({ 'imdb.rating': { $lt: 5 } }, { $inc: { 'imdb.rating': 1 } });
              console.log(chalk.green(`Updated ${incLow.modifiedCount} movies`));
              break;
            case 'Back':
              break;
          }
          break;

        case 'Delete Data':
          const deleteOps = [
            'Delete first comment',
            'Delete all comments for The Matrix',
            'Delete movies with no genres',
            'Back'
          ];
          const { deleteChoice } = await inquirer.prompt([{
            type: 'list',
            name: 'deleteChoice',
            message: 'Select a delete operation:',
            choices: deleteOps
          }]);
          switch (deleteChoice) {
            case 'Delete first comment':
              const firstComment = await comments.findOne();
              if (firstComment) {
                await comments.deleteOne({ _id: firstComment._id });
                console.log(chalk.green('Deleted comment id:', firstComment._id.toString()));
              }
              break;
            case 'Delete all comments for The Matrix':
              if (matrixMovie) {
                const delMatrix = await comments.deleteMany({ movie_id: matrixMovie._id });
                console.log(chalk.green(`Deleted ${delMatrix.deletedCount} comments for The Matrix`));
              }
              break;
            case 'Delete movies with no genres':
              const delNoGenres = await movies.deleteMany({ $or: [{ genres: { $exists: false } }, { genres: { $size: 0 } }] });
              console.log(chalk.green(`Deleted ${delNoGenres.deletedCount} movies with no genres`));
              break;
            case 'Back':
              break;
          }
          break;

        case 'Aggregate Movies':
          const aggOps = [
            'Count movies per year',
            'Average IMDb by director',
            'Back'
          ];
          const { aggChoice } = await inquirer.prompt([{
            type: 'list',
            name: 'aggChoice',
            message: 'Select an aggregate operation:',
            choices: aggOps
          }]);
          switch (aggChoice) {
            case 'Count movies per year':
              const countPerYear = await movies.aggregate([
                { $match: { year: { $exists: true } } },
                { $group: { _id: '$year', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
              ]).toArray();
              console.table(countPerYear.map(c => ({ Year: c._id, Count: c.count })));
              break;
            case 'Average IMDb by director':
              const avgByDirector = await movies.aggregate([
                { $unwind: '$directors' },
                { $match: { 'imdb.rating': { $exists: true } } },
                { $group: { _id: '$directors', avgRating: { $avg: '$imdb.rating' }, count: { $sum: 1 } } },
                { $sort: { avgRating: -1 } }
              ]).toArray();
              console.table(avgByDirector.map(d => ({
                Director: d._id,
                'Avg IMDb': d.avgRating.toFixed(2),
                Movies: d.count
              })));
              break;
            case 'Back':
              break;
          }
          break;

        case 'Exit':
          exit = true;
          break;
      }
    }

    console.log(chalk.green.bold('\n🎉 Done. Exiting...'));

  } catch (err) {
    console.error(chalk.red('Error running queries:'), err);
  } finally {
    if (client) {
      try { await client.close(); } catch (e) { }
      console.log(chalk.blue('Disconnected from MongoDB'));
    }
    process.exit(0);
  }
}

run();
