import { PrismaClient, statusEmprestimo } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

const router = Router()

const emprestimoSchema = z.object({
  alunoId: z.number(),
  livroId: z.number()
})

router.get("/", async (req, res) => {
  try {
    const emprestimos = await prisma.emprestimo.findMany({
      include: {
        aluno: true,
        livro: true
      }
    })
    res.status(200).json(emprestimos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = emprestimoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { alunoId, livroId } = valida.data

  // pesquisa para validar o aluno (recebe-se apenas id)
  const dadoAluno = await prisma.aluno.findUnique({
    where: { id: alunoId }
  })

  if (!dadoAluno) {
    res.status(400).json({ erro: "Erro... Código do aluno inválido" })
    return
  }

  const dadoLivro = await prisma.livro.findUnique({
    where: { id: livroId }
  })

  if (!dadoLivro) {
    res.status(400).json({ erro: "Erro... Livro não encontrado"})
    return
  }

  try {
    const [emprestimo, aluno] = await prisma.$transaction([
      prisma.emprestimo.create({
        data: { 
          alunoId, 
          livroId,
          dataDevolucao: new Date(Date.now() + 10) 
        }
      }),
      prisma.livro.update({
        where: { id: livroId },
        data: { status: statusEmprestimo.PENDENTE, disponivel: false }
      })])
    res.status(201).json({ emprestimo, aluno })
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {

    const emprestimoExcluido = await prisma.emprestimo.findUnique({ where: { id: Number(id) } })

    const [emprestimo, aluno] = await prisma.$transaction([
      prisma.emprestimo.delete({ where: { id: Number(id) } }),
      prisma.livro.update({
        where: { id: emprestimoExcluido?.alunoId },
        data: { status: statusEmprestimo.DEVOLVIDO, disponivel: true }
      })])

    res.status(200).json({ emprestimo, aluno })
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router
