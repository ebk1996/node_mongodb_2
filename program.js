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
    const comments = db.collection('comments');
    // Define available operations for the main menu
    const operations = [
      'Update Movies',
      'Delete Data',
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
        case 'Update Movies': {
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
            case 'Add available_on to The Matrix': {
              if (matrixMovie) {
                await movies.updateOne({ _id: matrixMovie._id }, { $set: { available_on: 'Sflix' } });
                console.log(chalk.green('Updated The Matrix with available_on: Sflix'));
              }
              break;
            }
            case 'Increment Metacritic of The Matrix': {
              if (matrixMovie) {
                await movies.updateOne({ _id: matrixMovie._id }, { $inc: { metacritic: 1 } });
                console.log(chalk.green('Incremented Metacritic for The Matrix'));
              }
              break;
            }
            // ... other cases ...
            case 'Back': {
              break;
            }
          }
          break;
        }
        case 'Delete Data': {
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
            case 'Delete first comment': {
              const firstComment = await comments.findOne();
              if (firstComment) {
                await comments.deleteOne({ _id: firstComment._id });
                console.log(chalk.green('Deleted comment id:', firstComment._id.toString()));
              }
              break;
            }
            case 'Delete all comments for The Matrix': {
              const matrixMovieForDelete = await movies.findOne({ title: 'The Matrix' });
              if (matrixMovieForDelete) {
                const delMatrix = await comments.deleteMany({ movie_id: matrixMovieForDelete._id });
                console.log(chalk.green(`Deleted ${delMatrix.deletedCount} comments for The Matrix`));
              }
              break;
            }
            // ... other cases ...
            case 'Back': {
              break;
            }
          }
          break;
        }
        // ... other cases ...
        case 'Exit': {
          exit = true;
          break;
        }
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
