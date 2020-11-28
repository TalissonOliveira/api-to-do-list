const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config() //dotenv para não deixar a url do mongodb com senha e login expostos

//Criar porta
const PORT = process.env.PORT || 3333 //process.env.PORT(variável de ambiente), se existir(qnd fizer deploy) o app usa ela pra rodar, se nao exitir(local) utiliza 3333

const app = express()
//Aplicar middleware
app.use(express.json()) //fazer o app entender json
app.use(cors()) //utilizar cors para poder fazer requisições pra essa API de qualquer endereço

//Conectar banco de dados
mongoose.connect(process.env.MONGO_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true
}, () => console.log('Banco de dados conectado com sucesso!'))

//Models - esquemas como os dados vão ser salvos
const UserSchema = new mongoose.Schema({
    username: String
})
const User = mongoose.model('User', UserSchema)

const TodoSchema = new mongoose.Schema({
    description: String,
    done: Boolean,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' //Referenciar o model de User
    }
})

const Todo = mongoose.model('Todo', TodoSchema)

//ROTAS
app.get('/', (req, res) => console.log('hello world!'))
//Logando usuário
app.post('/session', async (req, res) => {
    const { username } = req.body //pegar do corpo da requisição
    let user = ''
    try {
        const user = await User.findOne({ username: username}) //procurar pelo username igual ao username informado na requisição
        if(!user) { //se nao existir o user
            user = await User.create({ username: username }) //criar username com o username informado na requisição
        }
        return res.status(200).send(user)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Criar todo POST
app.post('/todo/:user_id', async (req, res) => {
    const { description, done } = req.body
    const { user_id } = req.params //pegar dos parâmetros
    try {
        //criar novo todo
        const newTodo = await Todo.create({ description, done, user: user_id })
        return res.status(200).send(newTodo)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Listar todos GET
app.get('/todo/:user_id', async (req, res) => {
    const { user_id } = req.params
    try {
        const allTodos = await Todo.find({ user: user_id }) //procurar por todos Todo que tiver o user = user_id
        return res.status(200).send(allTodos)
    } catch (err) {
        return res.status(400).send(err)
    }
})

//Atualizar todos PATCH / PUT
app.patch('/todo/:user_id/:todo_id', async (req, res) => {
    const data = req.body
    const { todo_id, user_id } = req.params
    try {
        const belongsToUser = await Todo.findOne({ user: user_id}) //verificar se o user do Todo é igual ao user_id informado na rota
        //se nao for
        if (!belongsToUser) return res.status(400).send('Operation not allowed!')
        //se for
        const updatedTodo = await Todo.findByIdAndUpdate(todo_id, data, { new: true })//retornar todo atualizado
        return res.status(200).send(updatedTodo)
    } catch (err) {
        return res.status(400).send(err)
    }
})
//Deletar todos DELETE
app.delete('/todo/:user_id/:todo_id', async (req, res) => {
    const { todo_id, user_id } = req.params
    try {
        const belongsToUser = await Todo.findOne({ user: user_id}) //verificar se o user do Todo é igual ao user_id informado na rota
        //se nao for
        if (!belongsToUser) return res.status(400).send('Operation not allowed!')
        //se for
        const deletedTodo = await Todo.findByIdAndDelete(todo_id)
        return res.status(200).send({
            message: 'Todo deletado com sucesso',
            deletedTodo
        })
    } catch (err) {
        return res.status(400).send(err)
    }
})

// Rodando o projeto
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))