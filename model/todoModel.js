//model schema for CRUD operation in Todo

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const todoSchema = new Schema(
    {
        todo: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 100,
            trim: true
        },
        username: {
            type: String,
            required: true,
        },
        creationTime: {
            type: Date,
            default: Date.now()
        }
    },
    {
        timestamps: true
    }
)

module.exports=mongoose.model("todo",todoSchema)