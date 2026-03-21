import React from 'react'
import {
  ShoppingCart, Home, Car, Fuel, Palmtree, Pill, GraduationCap,
  CreditCard, Banknote, Hexagon, Smartphone, Repeat2, TrendingUp,
  Wallet, UtensilsCrossed, PiggyBank, Building2,
  Receipt, Heart, Truck, Package, MapPin, Plane,
  ArrowLeftRight, Store, PawPrint, Bus, Scissors
} from 'lucide-react'

export const categoryIcons = {
  // Gastos
  "Aplicativos":               { icon: <Smartphone size={14} />,      color: "bg-indigo-100 text-indigo-600"  },
  "Assinaturas":               { icon: <Repeat2 size={14} />,         color: "bg-purple-100 text-purple-600"  },
  "Boletos Diversos":          { icon: <Receipt size={14} />,         color: "bg-orange-100 text-orange-600"  },
  "Carro":                     { icon: <Car size={14} />,             color: "bg-blue-100 text-blue-600"      },
  "Casa":                      { icon: <Home size={14} />,            color: "bg-slate-100 text-slate-600"    },
  "Combustível":               { icon: <Fuel size={14} />,            color: "bg-sky-100 text-sky-600"        },
  "Cuidados Pessoais":         { icon: <Scissors size={14} />,        color: "bg-pink-100 text-pink-600"      },
  "Delivery":                  { icon: <Truck size={14} />,           color: "bg-amber-100 text-amber-600"    },
  "Educação":                  { icon: <GraduationCap size={14} />,   color: "bg-violet-100 text-violet-600"  },
  "Empréstimos":               { icon: <Banknote size={14} />,        color: "bg-red-100 text-red-600"        },
  "Empréstimos e Financiamentos": { icon: <Banknote size={14} />,     color: "bg-red-100 text-red-600"        },
  "Lazer":                     { icon: <Palmtree size={14} />,        color: "bg-emerald-100 text-emerald-600"},
  "Lojas e Sites":             { icon: <Store size={14} />,           color: "bg-cyan-100 text-cyan-600"      },
  "Mercado":                   { icon: <ShoppingCart size={14} />,    color: "bg-amber-100 text-amber-600"    },
  "Mesma Titularidade":        { icon: <ArrowLeftRight size={14} />,  color: "bg-slate-100 text-slate-500"    },
  "Outros":                    { icon: <Hexagon size={14} />,         color: "bg-gray-100 text-gray-500"      },
  "Outros gastos":             { icon: <Hexagon size={14} />,         color: "bg-gray-100 text-gray-500"      },
  "Outros Gastos":             { icon: <Hexagon size={14} />,         color: "bg-gray-100 text-gray-500"      },
  "Pagamento de Fatura":       { icon: <CreditCard size={14} />,      color: "bg-slate-100 text-slate-700"    },
  "Pets":                      { icon: <PawPrint size={14} />,        color: "bg-lime-100 text-lime-600"      },
  "Restaurantes":              { icon: <UtensilsCrossed size={14} />, color: "bg-orange-100 text-orange-600"  },
  "Saque":                     { icon: <Wallet size={14} />,          color: "bg-yellow-100 text-yellow-600"  },
  "Saúde":                     { icon: <Pill size={14} />,            color: "bg-rose-100 text-rose-600"      },
  "Transferências Diversas":   { icon: <ArrowLeftRight size={14} />,  color: "bg-slate-100 text-slate-500"    },
  "Transporte por App":        { icon: <MapPin size={14} />,          color: "bg-indigo-100 text-indigo-500"  },
  "Transporte Público":        { icon: <Bus size={14} />,             color: "bg-blue-100 text-blue-500"      },
  "Viagens":                   { icon: <Plane size={14} />,           color: "bg-teal-100 text-teal-600"      },
  // Renda / sistema
  "Renda":                     { icon: <TrendingUp size={14} />,      color: "bg-green-100 text-green-600"    },
  "Reserva":                   { icon: <PiggyBank size={14} />,       color: "bg-blue-100 text-blue-600"      },
  "Investimento":              { icon: <Building2 size={14} />,       color: "bg-teal-100 text-teal-600"      },
  "Cartão":                    { icon: <CreditCard size={14} />,      color: "bg-slate-100 text-slate-700"    },
  "Alimentação":               { icon: <UtensilsCrossed size={14} />, color: "bg-orange-100 text-orange-600"  },
}