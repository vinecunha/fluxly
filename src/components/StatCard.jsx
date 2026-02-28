import React from 'react'

export const StatCard = ({ title, value, color }) => (
  <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-50">
    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">{title}</p>
    <p className={`text-xl font-black ${color}`}>R$ {Number(value).toLocaleString()}</p>
  </div>
)