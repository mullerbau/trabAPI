import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

const router = Router()

const livroSchema = z.object({
  nome: z.string().min(4,
    { message: "Nome do livro deve possuir, no mínimo, 4 caracteres" }),
  quant: z.number().min(1,
    { message: "Deve haver pelo menos 1 livro para cadastro"}
  )

})

router.get("/", async (req, res) => {
  try {
    const livros = await prisma.livro.findMany()
    res.status(200).json(livros)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = livroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, quant } = valida.data

  try {
    const livro = await prisma.livro.create({
      data: { nome, quant }
    })
    res.status(201).json(livro)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const livro = await prisma.livro.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(livro)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = livroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, quant } = valida.data

  try {
    const livro = await prisma.livro.update({
      where: { id: Number(id) },
      data: { nome, quant }
    })
    res.status(200).json(livro)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router
