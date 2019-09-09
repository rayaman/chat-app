const socket = io()

// Elements
const $chatForm = document.querySelector("#chatform")
const $chatFormInput = $chatForm.querySelector("input")
const $chatFormButton = $chatForm.querySelector("button")
const $locationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")


// Templates
const $messageTemplate = document.querySelector("#message-template").innerHTML
const $locationTemplate = document.querySelector("#location-template").innerHTML
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = (force) => {
    // New message element
    const $newmessage = $messages.lastElementChild

    // height of new message
    const newMessageStyles = getComputedStyle($newmessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newmessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerheight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffest = $messages.scrollTop + visibleHeight
    if (force) {
        return $messages.scrollTop = $messages.scrollHeight
    }
    if (containerheight - newMessageHeight <= scrollOffest) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

socket.on("message", (msg) => {
    const html = Mustache.render($messageTemplate, {
        message: msg.text,
        username: msg.username,
        createdAt: moment(msg.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationmessage", (location) => {
    const html = Mustache.render($locationTemplate, {
        location: location.url,
        username: location.username,
        createdAt: moment(location.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

const text = document.querySelector("input")
$chatForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $chatFormButton.setAttribute('disabled', 'disabled')
    autoscroll(true)
    socket.emit("sendMessage", e.target.elements.message.value, (error) => {
        $chatFormButton.removeAttribute('disabled')
        $chatFormInput.value = ""
        $chatFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log("message delivered!")
    })
})

$locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.")
    }
    $locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        socket.emit("sendLocation", {
            latitude,
            longitude
        }, () => {
            $locationButton.removeAttribute('disabled')
            console.log("Location shared!")
        })
    })
})

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})