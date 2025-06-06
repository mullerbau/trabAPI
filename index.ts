import express from 'express'
import dotenv from "dotenv"
import routesAlunos from './routes/alunos'
import routesLivros from './routes/livros'
import routesEmprestimo from './routes/emprestimos'

dotenv.config()
const app = express()
const port = 3000

app.use(express.json())

app.use("/alunos", routesAlunos)
app.use("/livros", routesLivros)
app.use("/emprestimos", routesEmprestimo)


app.get('/', (req, res) => {
  res.send('API: Controle de Bibilioteca Academia Girão')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})