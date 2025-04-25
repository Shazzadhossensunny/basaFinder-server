import app from './app';
import mongoose from 'mongoose';
import config from './app/config';

async function main() {
  try {
    await mongoose.connect(config.mongoDb_uri as string);
    app.listen(config.port, () => {
      console.log(`BasaFinder server running on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();

// Handle uncaught exceptions
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   process.exit(1);
// });

// process.on('unhandledRejection', (error) => {
//   console.error('Unhandled Rejection:', error);
//   process.exit(1);
// });
