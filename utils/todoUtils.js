const todoDatavalidation = ({ todo }) => {
    return new Promise((resolve,reject)=> {
        if (!todo)
            reject("Missing todo text")

        if (typeof todo !== 'string')
            reject("Todo is not a text")

        if (todo.length < 3 || todo.length > 100)
            reject("todo length should be 3-100 characters")

        
        resolve()
    })
}

module.exports=todoDatavalidation