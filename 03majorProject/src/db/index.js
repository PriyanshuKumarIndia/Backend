import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}${process.env.DB_SUFFIX}`
    );
    console.log(`Connected to MongoDB database: ${connectionInstance}`);
    console.log(
      `Connected to MongoDB database, Host - Name: ${connectionInstance.connection.host} - ${connectionInstance.connection.name}`
    );
  } catch (error) {
    console.error(`Error connecting to the database: ${error.message}`);
  }
};
export default connectDB;
