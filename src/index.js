const express = require("express")
const path = require('path')
const socketio = require("socket.io")
const http = require("http")
const Filter = require("bad-words")
const {
    generateMessage,
    generateLocationMessage
} = require("./utils/messages")
const {
    addUser,
    removeUser,
    getuser,
    getUsersInRoom
} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

io.on("connection", (socket) => {
    console.log("New WebSocket connection")

    socket.on("join", (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit("message", generateMessage("Admin", "Welcome!"))
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined!`))

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on("sendMessage", (msg, callback) => {
        const user = getuser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return callback("Profanity is not allowed!")
        }

        io.to(user.room).emit("message", generateMessage(user.username, msg))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit("message", generateMessage(`${user.username} has left!`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on("sendLocation", (coords, callback) => {
        const user = getuser(socket.id)
        socket.broadcast.to(user.room).emit("locationmessage", generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})


server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})