// creating schema to store db
// for each querry need a model, form a model need a schema

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        require: true, 
        unique: true
    },
    username: {
        type: String,
        require: true, 
        unique: true
    },
    password: {
        type: String,
        require: true
    },
})

/* 

insted of this 

const userModel = mongoose.model("user", userSchema)
module.exports = userModel;

file name is already userModel. just need to export file.

*/

module.exports = mongoose.model("user", userSchema)