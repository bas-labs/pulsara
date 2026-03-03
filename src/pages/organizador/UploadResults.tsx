import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const client = generateClient<Schema>()

interface ParsedResult {
  bibNumber: string
  athleteName: string
  distanceName: string
  chipTime: string
  gunTime?: string
  overallRank: number
  genderRank?: number
  categoryRank?: number
  ageGroup?: string
  pace?: string
  gender?: string
}

function parseCSV(text: string): ParsedResult[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim())
    const get = (key: string) => cols[headers.indexOf(key)] ?? ''
    return {
      bibNumber: get('bib') || get('dorsal') || get('numero'),
      athleteName: get('name') || get('nombre') || get('athlete') || get('atleta'),
      distanceName: get('distance') || get('distancia'),
      chipTime: get('chip') || get('chip_time') || get('tiempo_chip'),
      gunTime: get('gun') || get('gun_time') || get('tiempo_disparo') || undefined,
      overallRank: parseInt(get('rank') || get('pos') || get('posicion') || '0'),
      genderRank: parseInt(get('gender_rank') || get('pos_genero') || '0') || undefined,
      ageGroup: get('category') || get('categoria') || get('age_group') || undefined,
      pace: get('pace') || get('ritmo') || undefined,
      gender: get('gender') || get('genero') || get('sexo') || undefined,
    }
  }).filter(r => r.athleteName && r.chipTime)
}

export default function UploadResults() {
  const { eventId } = useParams()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedResult[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(0)
  const [fileName, setFileName] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const results = parseCSV(text)
      setParsed(results)
      if (results.length === 0) {
        toast.error('No se pudieron leer resultados del archivo')
      } else {
        toast.success(`${results.length} resultados encontrados`)
      }
    }
    reader.readAsText(file)
  }

  async function handleUpload() {
    if (!eventId || parsed.length === 0) return
    setUploading(true)
    let count = 0

    for (const r of parsed) {
      try {
        await client.models.Result.create({
          eventId,
          userId: "org-upload",
          bibNumber: parseInt(r.bibNumber) || 0,
          athleteName: r.athleteName,
          distanceName: r.distanceName,
          chipTime: r.chipTime,
          gunTime: r.gunTime,
          overallRank: r.overallRank,
          genderRank: r.genderRank,
          ageGroup: r.ageGroup,
          pace: r.pace,
          gender: (['M','F','NB','OTHER'].includes(r.gender?.toUpperCase() ?? '') ? r.gender?.toUpperCase() as any : undefined),
          status: 'FINISHED',
        })
        count++
        setUploaded(count)
      } catch (err) {
        console.error(`Failed to upload result for ${r.athleteName}:`, err)
      }
    }

    toast.success(`${count} resultados subidos exitosamente`)
    setUploading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to={`/org/evento/${eventId}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al evento
      </Link>

      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Subir Resultados</h1>
      <p className="text-zinc-500 mb-8">Sube un archivo CSV con los resultados de la competencia</p>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-zinc-900">Formato CSV</h3>
              <p className="text-sm text-zinc-500">Columnas: bib, nombre, distancia, chip_time, pos, genero, categoria, ritmo</p>
            </div>
          </div>

          <Input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="cursor-pointer"
          />
          {fileName && <p className="text-sm text-zinc-500 mt-2">Archivo: {fileName}</p>}
        </CardContent>
      </Card>

      {parsed.length > 0 && (
        <>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900">Vista previa ({parsed.length} resultados)</h3>
                <Badge className="bg-emerald-100 text-emerald-700">{parsed.length} filas</Badge>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-zinc-500">
                      <th className="pb-2">Dorsal</th>
                      <th className="pb-2">Nombre</th>
                      <th className="pb-2">Distancia</th>
                      <th className="pb-2">Chip Time</th>
                      <th className="pb-2">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-zinc-100">
                        <td className="py-2">{r.bibNumber}</td>
                        <td className="py-2 font-medium">{r.athleteName}</td>
                        <td className="py-2">{r.distanceName}</td>
                        <td className="py-2 font-mono">{r.chipTime}</td>
                        <td className="py-2">#{r.overallRank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 10 && (
                  <p className="text-xs text-zinc-400 mt-2">... y {parsed.length - 10} más</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Subiendo {uploaded}/{parsed.length}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir {parsed.length} resultados
                </>
              )}
            </Button>
            {uploading && (
              <div className="flex items-center gap-2">
                <div className="w-48 bg-zinc-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${(uploaded / parsed.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-zinc-500">{Math.round((uploaded / parsed.length) * 100)}%</span>
              </div>
            )}
          </div>
        </>
      )}

      <Card className="mt-8 border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Formato esperado del CSV</p>
            <code className="block mt-1 text-xs bg-amber-100 p-2 rounded">
              bib,nombre,distancia,chip_time,pos,genero,categoria,ritmo<br/>
              101,Juan Pérez,10K,00:42:15,1,M,20-29,4:13<br/>
              102,María López,10K,00:45:30,2,F,30-39,4:33
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
