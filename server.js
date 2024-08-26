const express = require('express');
require('dotenv').config()
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const session = require('express-session')
const mongodbSession = require('connect-mongodb-session')(session)



// file imports
const { userDataValidator, isEmailValidate } = require('./utils/authUtils');
const userModel = require('./model/userModel');
const isAuth = require('./middleware/isAuth');
const todoDatavalidation = require('./utils/todoUtils');
const todoModel = require('./model/todoModel');



const app = express();
const PORT = process.env.PORT || 8000;
const store = new mongodbSession({  // craating store variable for session
    uri: process.env.MONGO_URI,
    collection: "sessions"
})



// db connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("mongodb connected successfully"))
    .catch((err => console.log(err)))



// Middleware
app.use(express.static("public"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");   // Set EJS as the view engine// Routes
app.get('/', (req, res) => {
    return res.send('Server is running...........');
});
app.use(session({       /* declear middleware session */
    secret: process.env.SECRET_KEY,
    store: store,
    resave: false,
    saveUninitialized: false
}))



app.get('/register', (req, res) => {
    return res.render('registerPage')
})

app.post('/register', async (req, res) => {
    console.log(req.body)
    const { name, email, username, password } = req.body    // destructuring name,email,username and password

    /*  here need to do :-
        1.  data validation
        2.  store into db
        3.  check email and username exist or not
        4. encrypted password
    */

    /* data validation start*/

    try {
        await userDataValidator({ name, email, username, password })
    } catch (error) {
        return res.status(400).json(error)
    }

    /*  data validation stop*/

    try {
        /* check if email and username exist start */
        const userEmailExist = await userModel.findOne({ email: email })
        const userUsernameExist = await userModel.findOne({ username: username })

        if (userEmailExist && userUsernameExist) {
            return res.status(400).json(`Email and Username both already exist ${email} and ${username}`)
        }

        if (userEmailExist) {
            return res.status(400).json(`Email already exist ${email}`)
        }

        if (userUsernameExist) {
            return res.status(400).json(`Username already exist ${username}`)
        }


        console.log(`user email-- ${userUsernameExist}`)    // email

        /* checking password encrypted or not */
        console.log(password)   // user password
        console.log(await bcrypt.hash(password, Number(process.env.SALT)))    // encrypted password
        /* checking password encrypted or not */

        // hashed/encrypted password
        const hashedPassword = await bcrypt.hash(password, 10)


        /* check if email and username exist stop */

        /*  store into db start  */

        // creating an objectof userSchema

        // for each querry need a model, form a model need a schema
        const userObj = new userModel({
            name: name,
            username: username,
            email: email,
            password: hashedPassword
        })
        const userDb = await userObj.save() // store the data in userDb

        // return res.status(200).json({
        //     message: "User Created successfully",
        //     data: userDb
        // })
        return res.redirect("/login")           // redirect to login page after register


    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error
        })
    }

    /*  store into db stop  */


    // return res.send('register api working...')
})

app.get('/login', (req, res) => {
    return res.render('loginPage')
})

app.post('/login', async (req, res) => {
    console.log(req.body)

    const { loginId, password } = req.body  // in login form input field name is loginId

    if (!loginId || !password) return res.status(400).json('missing user details')

    /*  here need to do :-
        1. find the user with loginID
        2. compare password
        3. session based auth/login
    */

    try {
        /* login or find user using loginId start*/

        let userDb = {}
        if (isEmailValidate({ key: loginId })) {
            console.log("inside email")
            userDb = await userModel.findOne({ email: loginId })
        }
        else {
            console.log("inside username")
            userDb = await userModel.findOne({ username: loginId })
        }
        console.log(userDb)

        // check user is exist or not
        if (!userDb) return res.status(400).json("user not found, please register")

        /* login or find user using loginId stop */

        /* password comparision start */
        console.log(password, userDb.password)

        const isMatched = await bcrypt.compare(password, userDb.password)  // it return promise, so make it await
        console.log(isMatched)

        if (!isMatched) return res.status(400).json("incorrected password")


        /* session based auth start */
        console.log(req.session)
        req.session.isAuth = true
        req.session.user = {
            userId: userDb._id,
            username: userDb.username,
            email: userDb.email
        }

        /* session based auth stop */

        // return res.status(200).json("login successfull")
        return res.redirect("/dashboard")           // redirect to dashboard page after login


        /* password comparision stop */
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error
        })
    }
})

/* Dashboard */
app.get("/dashboard", isAuth, (req, res) => {
    return res.render('dashboardPage')
})

/* Logout */
app.post("/logout", isAuth, (req, res) => {
    // for single logout this is shortcut method. no need to declear session schema
    req.session.destroy((err) => {
        if (err) console.log(err)
        // return res.status(200).json("logout done")
        return res.redirect("/login")   // redirect to login page after logout
    })
})

app.post("/logout-out-from-all", isAuth, async (req, res) => {

    //user
    console.log(req.session)
    const username = req.session.user.username    // need username so pick it from session

    // for logout for all devices this is no shortcut method. need to create session schema
    // create session schema
    // single line schema. just took needed flield so make strict as false,can be use all fields
    const sessionSchema = new mongoose.Schema({ _id: String }, { strict: false })

    // convert schema into model 
    const sessionModel = mongoose.model("session", sessionSchema)

    //-----------------------------------------------------------------------------------
    //  generate by chatgpt
    // let sessionModel;
    // try {
    //     sessionModel = mongoose.model("session");
    // } catch (error) {
    //     // Define the model only if it doesn't exist
    //     const sessionSchema = new mongoose.Schema({ _id: String }, { strict: false });
    //     sessionModel = mongoose.model("session", sessionSchema);
    // }

    //-----------------------------------------------------------------------------------


    // perform model.querry 
    try {
        const deleteDb = await sessionModel.deleteMany({
            "session.user.username": username
            // here have to pass session.user.usernameas string bcz left side schema value
        })
        console.log(deleteDb)

        return res.status(200).json({
            message: "logout from all devices done",
            data: deleteDb
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal error",
            error: error
        })
    }
})


/*----------------------------------------------------------------------------------------------------------------------------------*/


// Todo api's

//create-item
app.post('/create-item', isAuth, async (req, res) => {
    console.log(req.body)
    const todo = req.body.todo    // todo is textfiled name in dashboardPage
    const username = req.session.user.username

    // data validation
    try {
        await todoDatavalidation({ todo })    // promise return a string, make it string
    } catch (error) {
        return res.send({
            status: 400,
            message: error
        })
    }
    // create entry in Db
    const todoObj = new todoModel({ todo: todo, username: username })
    try {
        const todoDb = await todoObj.save()     // todoobj promis to return something
        return res.send({
            status: 201,
            message: "todo created",
            data: todoDb,
        })

    } catch (error) {
        return res.send({
            status: 500,
            message: "Internal Server error",
            error: error
        })
    }
})

//  read-item
//  (pagination)
//  read-item?skip=5    (when read-item hit as well as send skip value) 
app.get('/read-item', isAuth, async (req, res) => {
    // read todo only loged in users
    const username = req.session.user.username
    const SKIP = Number(req.query.skip) || 0    // if skip here small case then in url must be skip smallcase

    try {
        // const todoDbList = await todoModel.find({ username: username })
        
        const todoDbList = await todoModel.aggregate([
            //match, skip,limit
            {
                $match:{username:username}
            },
            {
                $skip:SKIP,
            },
            {
                $limit:5,
            }
        ])
        // console.log(`SKIP: ${SKIP}`);
        console.log(todoDbList)
        if (todoDbList.length === 0)   // if username dont have any todo
            return res.send({ status: 200, message: "no todo found !!" })

        return res.send({
            status: 200,
            message: "todo read done",
            data: todoDbList
        })
    } catch (error) {
        return res.send({
            status: 500,
            message: "internal server error",
            error: error
        })
    }

})

//edit-item
app.post("/edit-item", async (req, res) => {

    console.log(req.body)
    const { newData, todoId } = req.body
    const username = req.session.user.username

    if (!todoId) {
        return res.send({
            status: 400,
            message: "missing todo id"
        })
    }

    /* need to to
        1. data validation
        2. update todo using findoneandupdate({todoID},{todo:newData})
        3. ownership check
    */

    // data validation
    try {
        await todoDatavalidation({ todo: newData })
    } catch (error) {
        return res.send({
            status: 400,
            message: error,
        })
    }

    //find the todo from db with todoId
    try {
        const todoDb = await todoModel.findOne({ _id: todoId });
        if (!todoDb) {
            return res.send({
                status: 400,
                message: `No todo found for this userid : ${todoId}`,
            });
        }
        console.log(username, todoDb.username);

        //ownership check
        if (username !== todoDb.username) {
            return res.send({
                status: 403,
                message: "not allowed to edit todo",
            });
        }
        console.log(todoDb.todo)

        // update todo
        const todoUpdatedDb = await todoModel.findOneAndUpdate(
            { _id: todoId },    // this is for condition. if multiple condition check , modify this object
            { todo: newData },  // this is for update. if multiple entry update, modify this object
            { new: true }       // this is optional. to show updated data in output
        )
        return res.send({
            status: 200,
            message: "todo updated done",
            data: todoUpdatedDb
        })

    } catch (error) {
        return res.send({
            status: 400,
            message: "internal server error",
            error: error
        })
    }
})

//delete-item
app.post("/delete-item", isAuth, async (req, res) => {
    const todoId = req.body.todoId
    const username = req.session.user.username

    // data validation
    if (!todoId) {
        return res.send({
            status: 400,
            message: "missing todo id"
        })
    }

    // ownership check
    try {
        const todoDb = await todoModel.findOne({ _id: todoId })
        if (!todoDb) {
            return res.send({
                status: 400,
                message: `no todo found with todoID ${todoId}`,
            });
        }

        if (todoDb.username !== username) {
            return res.send({
                status: 403,
                message: `not allowed to delete todo`,
            });
        }

        // // delete todo
        const todoDeletedDb = await todoModel.findOneAndDelete({ _id: todoId })
        return res.send({
            status: 200,
            message: `todo deleted`,
            data: todoDeletedDb
        });
    } catch (error) {
        return res.send({
            status: 400,
            message: "internal server error",
            error: error
        })
    }
})

/*----------------------------------------------------------------------------------------------------------------------------------*/

//pagination




// Server
app.listen(PORT, () => {
    console.log(`Server is running at:`);
    console.log(`http://localhost:${PORT}/`);
});




/* need to do
    1. logout all devices api
    2. session schema for logout all devices
    3. convert schema into model
    4. perform model.querry
    5. todo api
    6. create todo
    7. read todo
*/