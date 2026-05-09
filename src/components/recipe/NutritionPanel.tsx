interface NutritionPanelProps {
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  servingMultiplier?: number
}

export function NutritionPanel({
  calories,
  protein_g,
  carbs_g,
  fat_g,
  servingMultiplier = 1,
}: NutritionPanelProps) {
  if (!calories && !protein_g && !carbs_g && !fat_g) return null

  const scale = (v: number | null) =>
    v !== null ? Math.round(v * servingMultiplier * 10) / 10 : null

  const stats = [
    { label: 'Calories', value: scale(calories), unit: 'kcal' },
    { label: 'Protein', value: scale(protein_g), unit: 'g' },
    { label: 'Carbs', value: scale(carbs_g), unit: 'g' },
    { label: 'Fat', value: scale(fat_g), unit: 'g' },
  ]

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Nutrition per serving
      </p>
      <div className="grid grid-cols-4 gap-2 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-lg font-bold">
              {stat.value !== null ? stat.value : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {stat.unit !== 'kcal' && stat.value !== null ? `${stat.unit} ` : ''}
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
