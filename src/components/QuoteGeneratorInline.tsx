import React, { useState } from "react";
import { CATAMARANS } from "../data";
import { DollarSign, Trash2, CheckCircle2 } from "lucide-react";

interface QuoteItem {
  vesselId: string;
  price: string;
}

interface QuoteGeneratorInlineProps {
  chatId: string;
  clientName: string;
  initialShip: string;
  onClose: () => void;
}

export default function QuoteGeneratorInline({
  chatId,
  clientName,
  initialShip,
  onClose,
}: QuoteGeneratorInlineProps) {
  const [items, setItems] = useState<QuoteItem[]>(
    CATAMARANS.filter(
      (c) => !initialShip || c.name === initialShip || c.id === initialShip,
    ).map((c) => ({
      vesselId: c.id,
      price: "",
    })),
  );

  const updatePrice = (vesselId: string, price: string) => {
    setItems(
      items.map((item) =>
        item.vesselId === vesselId ? { ...item, price } : item,
      ),
    );
  };

  const removeVessel = (vesselId: string) => {
    setItems(items.filter((item) => item.vesselId !== vesselId));
  };

  return (
    <div className="p-4 bg-slate-50 border-t border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-800">
          Quote Draft for {clientName}
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Close
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const vessel = CATAMARANS.find((c) => c.id === item.vesselId);
          if (!vessel) return null;
          return (
            <div
              key={item.vesselId}
              className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded text-xs"
            >
              <span className="flex-1 font-medium">{vessel.name}</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => updatePrice(item.vesselId, e.target.value)}
                  className="w-20 p-1 border border-slate-200 rounded"
                />
              </div>
              <button
                onClick={() => removeVessel(item.vesselId)}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded">
          Save Quote
        </button>
      </div>
    </div>
  );
}
