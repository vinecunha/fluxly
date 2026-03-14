import React from 'react'
import { ShoppingCart, Home, Car, Fuel, Palmtree, Pill, GraduationCap, CreditCard, Banknote, Hexagon } from 'lucide-react'

export const categoryIcons = {
  "Mercado": { icon: <ShoppingCart size={14} />, color: "bg-amber-100 text-amber-600" },
  "Casa": { icon: <Home size={14} />, color: "bg-indigo-100 text-indigo-600" },
  "Carro": { icon: <Car size={14} />, color: "bg-blue-100 text-blue-600" },
  "Combustível": { icon: <Fuel size={14} />, color: "bg-sky-100 text-sky-600" },
  "Lazer": { icon: <Palmtree size={14} />, color: "bg-emerald-100 text-emerald-600" },
  "Saúde": { icon: <Pill size={14} />, color: "bg-rose-100 text-rose-600" },
  "Educação": { icon: <GraduationCap size={14} />, color: "bg-violet-100 text-violet-600" },
  "Assinaturas": { icon: <CreditCard size={14} />, color: "bg-sky-100 text-sky-600" },
  "Empréstimos": { icon: <Banknote size={14} />, color: "bg-green-100 text-green-600" },
  "Outros": { icon: <Hexagon size={14} />, color: "bg-gray-100 text-gray-600" },
}