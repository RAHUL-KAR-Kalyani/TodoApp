window.onload = generateTodos;

let skip = 0


// for read-items
function generateTodos() {
    axios.get(`/read-item?skip=${skip}`)
        .then((res) => {
            if (res.data.status !== 200) {
                alert(res.data.message);    // alert is not working
                return;
            }

            // console.log(res.data.data);
            // console.log(skip);
            const todos = res.data.data;
            skip += todos.length;            
            // console.log(skip);

            document.getElementById('item_list').insertAdjacentHTML("beforeend", todos.map((item) => {
                return `
            <li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                <span class="item-text"> ${item.todo} </span>
                <div>
                    <button class="btn btn-primary btn-sm edit-me" data-id="${item._id}">edit</button>
                    <button class="btn btn-danger btn-sm delete-me" data-id="${item._id}">delete</button>
                </div>
            </li>
            `;
            }).join(" "));
        })
        .catch((err) => {
            console.log(err);
        });
}

// for edit delete and create
document.addEventListener('click', function (event) {

    // for edit-me
    if (event.target.classList.contains("edit-me")) {
        // console.log("edit button clicked")
        // console.log(event.target.getAttribute("data-id"))       // checking todo id is corrected or not
        const todoId = event.target.getAttribute("data-id")
        const newData = prompt("Enter new text")
        console.log(todoId, newData)
        axios.post('/edit-item', { todoId, newData })
            .then(res => {
                console.log(res)
                if (res.data.status !== 200) {
                    alert(res.data.message)
                    return;
                }
                event.target.parentElement.parentElement.querySelector(".item-text").innerHTML = res.data.data.todo
                // to remove li element write remve insted of querySelector
            })
            .catch(err => {
                console.log(err)
            })
    }

    // for delete-me
    else if (event.target.classList.contains("delete-me")) {
        console.log("delete button clicked")
        const todoId = event.target.getAttribute("data-id")
        axios.post('/delete-item', { todoId })  //in server.js pass todoID in req.body
            .then((res) => {
                console.log(res)
                if (res.data.status !== 200) {
                    alert(res.data.message)
                    return;
                }
                event.target.parentElement.parentElement.remove();
            })
            .catch((err) => {
                console.log(err)
            })
    }

    // for create-item or add-item
    else if (event.target.classList.contains("add_item")) {
        // console.log("add button clicked")
        console.log(document.getElementById("create_field").value)
        const todo = document.getElementById("create_field").value    // in server.js pass todo as req.body.todo

        axios.post('/create-item', { todo })
            .then((res) => {
                console.log(res)
                if (res.data.status !== 201) {
                    alert(res.data.message)
                    return;
                }
                document.getElementById("create_field").value = "";

                document.getElementById('item_list').insertAdjacentHTML("beforeend",

                    `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                        <span class="item-text"> ${res.data.data.todo} </span>
                        <div>
                            <button class="btn btn-primary btn-sm edit-me" data-id="${res.data.data._id}">edit</button>
                            <button class="btn btn-danger btn-sm delete-me" data-id="${res.data.data._id}">delete</button>
                        </div>
                    </li>`
                )
            })
            .catch((err) => {
                console.log(err)
            })
    }

    //for show more button in dashboard page
    else if (event.target.classList.contains("show_more")) {
        generateTodos()
    }
})