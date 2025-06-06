import { Aluno, PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { z } from 'zod'
import nodemailer from "nodemailer"


const prisma = new PrismaClient()

const router = Router()


const alunoSchema = z.object({
  nome: z.string().min(8,
    { message: "Nome deve possuir, no mínimo, 8 caracteres" }),
  email: z.string().email().min(10,
    { message: "E-mail, no mínimo, 10 caracteres" })
})

router.get("/", async (req, res) => {
  try {
    const alunos = await prisma.aluno.findMany()
    res.status(200).json(alunos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = alunoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email } = valida.data

  try {
    const aluno = await prisma.aluno.create({
      data: { nome, email }
    })
    res.status(201).json(aluno)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const aluno = await prisma.aluno.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(aluno)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = alunoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email } = valida.data

  try {
    const aluno = await prisma.aluno.update({
      where: { id: Number(id) },
      data: { nome, email }
    })
    res.status(200).json(aluno)
  } catch (error) {
    res.status(400).json({ error })
  }
})


function gerarTabelaHTML(dados: any) {
  let html = `
    <html>
    <body style="font-family: Helvetica, Arial, sans-serif;">
      <h2>Biblioteca Escolar: Relatório de Empréstimos</h2>
      <h3>Aluno: ${dados.nome}</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead style="background-color: rgb(195, 191, 191);">
          <tr>
            <th>Livro</th>
            <th>Autor</th>
            <th>Data do Empréstimo</th>
            <th>Data para Devolução</th>
            <th>Data Devolvida</th>
            <th>Status</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
  `

  for (const emprestimo of dados.emprestimos) {
    const dataEmprestimo = new Date(emprestimo.data).toLocaleDateString('pt-BR')
    const dataDevolucao = new Date(emprestimo.dataDevolucao).toLocaleDateString('pt-BR')
    const dataDevolvido = emprestimo.dataDevolvido
      ? new Date(emprestimo.dataDevolvido).toLocaleDateString('pt-BR')
      : "Não devolvido"

    html += `
      <tr>
        <td>${emprestimo.livro.nome}</td>
        <td>${emprestimo.livro.autor}</td>
        <td>${dataEmprestimo}</td>
        <td>${dataDevolucao}</td>
        <td>${dataDevolvido}</td>
        <td>${emprestimo.livro.status}</td>
        <td>${emprestimo.obs || "-"}</td>
      </tr>
    `
  }

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `

  return html
}

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

// Função que envia o e-mail
async function enviaEmail(dados: any) {
  const mensagem = gerarTabelaHTML(dados)

  await transporter.sendMail({
    from: 'Biblioteca Escolar <biblioteca@escola.com>',
    to: dados.email,
    subject: "Relatório de Empréstimos de Livros",
    html: mensagem,
  })
}

// Rota que envia e-mail com relatório de um aluno
router.get("/email/:id", async (req, res) => {
  const { id } = req.params

  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id: Number(id) },
      include: {
        emprestimos: {
          include: { livro: true }
        }
      }
    })

    if (!aluno) {
      return res.status(404).json({ erro: "Aluno não encontrado" })
    }

    await enviaEmail(aluno)

    res.status(200).json({ mensagem: "Relatório enviado para o e-mail do aluno." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao enviar relatório" })
  }
})

export default router
