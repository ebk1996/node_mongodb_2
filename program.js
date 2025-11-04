const connect = require('./db');
const { ObjectId } = require('mongodb');

async function run() {
  let client;
  try {
    const conn = await connect();
    const db = conn.db;
    client = conn.client;

    const movies = db.collection('movies');
    const users = db.collection('users');
    const comments = db.collection('comments');

    console.log('\n--- CREATE: Insert a new user ---');
    const newUser = { name: 'Johnny Doe', email: 'johnny@example.com' };
    const userInsert = await users.insertOne(newUser);
    console.log('Inserted user id:', userInsert.insertedId.toString());

    console.log('\n--- READ 1: Movies directed by Christopher Nolan ---');
    const nolan = await movies.find({ directors: 'Christopher Nolan' }).toArray();
    console.log('Christopher Nolan movies:', nolan.map(m => m.title));

    console.log('\n--- READ 2: Action movies sorted by year (desc) ---');
    const actionMovies = await movies.find({ genres: 'Action' })
      .sort({ year: -1 })
      .toArray();
    console.log('Action movies (desc year):', actionMovies.map(m => `${m.title} (${m.year})`));

    console.log('\n--- READ 3: Movies with imdb.rating > 8 (title + imdb) ---');
    const highRated = await movies.find({ 'imdb.rating': { $gt: 8 } })
      .project({ title: 1, imdb: 1 })
      .toArray();
    console.log('High rated movies:', highRated.map(m => ({ title: m.title, imdb: m.imdb })));

    console.log('\n--- READ 4: Movies starring both Tom Hanks and Tim Allen ---');
    const bothHanksAllen = await movies.find({ cast: { $all: ['Tom Hanks', 'Tim Allen'] } }).toArray();
    console.log('Movies with both actors:', bothHanksAllen.map(m => m.title));

    console.log('\n--- READ 5: Movies starring only Tom Hanks and Tim Allen ---');
    // Ensure cast array contains exactly those two and no more
    const onlyHanksAllen = await movies.find({
      cast: { $all: ['Tom Hanks', 'Tim Allen'] },
      $expr: { $eq: [{ $size: '$cast' }, 2] }
    }).toArray();
    console.log('Movies with only the two actors:', onlyHanksAllen.map(m => m.title));

    console.log('\n--- READ 6: Comedy movies directed by Steven Spielberg ---');
    const spielbergComedies = await movies.find({ directors: 'Steven Spielberg', genres: 'Comedy' }).toArray();
    console.log('Spielberg comedies:', spielbergComedies.map(m => m.title));

    console.log('\n--- UPDATE 1: Add available_on:"Sflix" to "The Matrix" ---');
    const updateAvailableOn = await movies.updateOne({ title: 'The Matrix' }, { $set: { available_on: 'Sflix' } });
    console.log('Matched/Modified:', updateAvailableOn.matchedCount, updateAvailableOn.modifiedCount);

    console.log('\n--- UPDATE 2: Increment metacritic of "The Matrix" by 1 ---');
    const incMetacritic = await movies.updateOne({ title: 'The Matrix' }, { $inc: { 'metacritic': 1 } });
    console.log('Matched/Modified:', incMetacritic.matchedCount, incMetacritic.modifiedCount);

    console.log('\n--- UPDATE 3: Add genre "Gen Z" to all movies from 1997 ---');
    const addGenZ = await movies.updateMany({ year: 1997 }, { $addToSet: { genres: 'Gen Z' } });
    console.log('Matched/Modified:', addGenZ.matchedCount, addGenZ.modifiedCount);

    console.log('\n--- UPDATE 4: Increase imdb.rating by 1 for movies with rating < 5 ---');
    const increaseLowImdb = await movies.updateMany({ 'imdb.rating': { $lt: 5 } }, { $inc: { 'imdb.rating': 1 } });
    console.log('Matched/Modified:', increaseLowImdb.matchedCount, increaseLowImdb.modifiedCount);

    console.log('\n--- DELETE 1: Delete a comment by specific ID (example id) ---');
    // Example: replace with a real ObjectId string if you have one
    const exampleCommentId = null; // set to string id to delete
    if (exampleCommentId) {
      const delComment = await comments.deleteOne({ _id: new ObjectId(exampleCommentId) });
      console.log('Deleted comment count:', delComment.deletedCount);
    } else {
      console.log('No example comment id provided; skipping single-comment delete.');
    }

    console.log('\n--- DELETE 2: Delete all comments for "The Matrix" ---');
    const delMatrixComments = await comments.deleteMany({ movie_title: 'The Matrix' });
    console.log('Deleted comments for The Matrix:', delMatrixComments.deletedCount);

    console.log('\n--- DELETE 3: Delete movies with no genres ---');
    const delNoGenres = await movies.deleteMany({ $or: [{ genres: { $exists: false } }, { genres: { $size: 0 } }] });
    console.log('Deleted movies with no genres:', delNoGenres.deletedCount);

    console.log('\n--- AGGREGATE 1: Count movies released each year (ascending) ---');
    const countPerYear = await movies.aggregate([
      { $match: { year: { $exists: true } } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    console.log('Movies per year:', countPerYear);

    console.log('\n--- AGGREGATE 2: Average imdb.rating by director (desc) ---');
    const avgByDirector = await movies.aggregate([
      { $unwind: '$directors' },
      { $match: { 'imdb.rating': { $exists: true } } },
      { $group: { _id: '$directors', avgRating: { $avg: '$imdb.rating' }, count: { $sum: 1 } } },
      { $sort: { avgRating: -1 } }
    ]).toArray();
    console.log('Average IMDb by director (desc):', avgByDirector.map(d => ({ director: d._id, avgRating: d.avgRating, count: d.count })));

  } catch (err) {
    console.error('Error running queries:', err);
  } finally {
    if (client) {
      try { await client.close(); } catch (e) { /* ignore */ }
      console.log('\nDisconnected from MongoDB');
    } else {
      console.log('\nClient was not created; nothing to close.');
    }
    process.exit(0);
  }
}

run();