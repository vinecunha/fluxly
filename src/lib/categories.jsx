import React from 'react'
import {
  ShoppingCart, Home, Car, Fuel, Palmtree, Pill, GraduationCap,
  CreditCard, Banknote, Hexagon, Smartphone, Repeat2, TrendingUp,
  Wallet, UtensilsCrossed, Zap, PiggyBank, Building2, Package
} from 'lucide-react'

export const categoryIcons = {
  "Mercado":      { icon: <ShoppingCart size={14} />,    color: "bg-amber-100 text-amber-600"   },
  "Casa":         { icon: <Home size={14} />,             color: "bg-slate-100 text-slate-600"   },
  "Carro":        { icon: <Car size={14} />,              color: "bg-blue-100 text-blue-600"     },
  "Combustível":  { icon: <Fuel size={14} />,             color: "bg-sky-100 text-sky-600"       },
  "Lazer":        { icon: <Palmtree size={14} />,         color: "bg-emerald-100 text-emerald-600"},
  "Saúde":        { icon: <Pill size={14} />,             color: "bg-rose-100 text-rose-600"     },
  "Educação":     { icon: <GraduationCap size={14} />,    color: "bg-violet-100 text-violet-600" },
  "Assinaturas":  { icon: <Repeat2 size={14} />,          color: "bg-purple-100 text-purple-600" },
  "Empréstimos":  { icon: <Banknote size={14} />,         color: "bg-red-100 text-red-600"       },
  "Aplicativos":  { icon: <Smartphone size={14} />,       color: "bg-indigo-100 text-indigo-600" },
  "Renda":        { icon: <TrendingUp size={14} />,       color: "bg-green-100 text-green-600"   },
  "Alimentação":  { icon: <UtensilsCrossed size={14} />,  color: "bg-orange-100 text-orange-600" },
  "Reserva":      { icon: <PiggyBank size={14} />,        color: "bg-blue-100 text-blue-600"     },
  "Investimento": { icon: <Building2 size={14} />,        color: "bg-teal-100 text-teal-600"     },
  "Cartão":       { icon: <CreditCard size={14} />,       color: "bg-slate-100 text-slate-700"   },
  "Outros":       { icon: <Hexagon size={14} />,          color: "bg-gray-100 text-gray-500"     },
}