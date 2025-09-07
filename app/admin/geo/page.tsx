"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Map, Flame, MapPin } from 'lucide-react'

type VillagePoint = { name: string; coords: [number, number]; users: number; anomalies: number; top: string }

const VILLAGES: VillagePoint[] = [
{ name: "Ankola", coords: [74.3040, 14.6620], users: 1200, anomalies: 96, top: "Consumption Spike" },
{ name: "Belambar", coords: [74.3910, 14.7560], users: 450, anomalies: 52, top: "Voltage Anomaly" },
{ name: "Hankon", coords: [74.3290, 14.7850], users: 320, anomalies: 18, top: "Power Factor Issue" },
]

export default function GeoPage() {
const mapRef = useRef<maplibregl.Map | null>(null)
const containerRef = useRef<HTMLDivElement>(null)
const [mode, setMode] = useState<"pins" | "heatmap">("pins")
const [isLoaded, setIsLoaded] = useState(false)

useEffect(() => {
  if (mapRef.current || !containerRef.current) return
  const map = new maplibregl.Map({
    container: containerRef.current,
    style: "https://demotiles.maplibre.org/style.json",
    center: [74.35, 14.72],
    zoom: 10,
    attributionControl: true,
  })
  mapRef.current = map

  const features = VILLAGES.map((v) => ({
    type: "Feature",
    properties: {
      name: v.name,
      users: v.users,
      anomalies: v.anomalies,
      theftPct: v.users ? v.anomalies / v.users : 0,
      top: v.top,
    },
    geometry: { type: "Point", coordinates: v.coords },
  }))

  map.on("load", () => {
    setIsLoaded(true)
    map.addSource("villages", {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    })

    map.addLayer({
      id: "villages-circle",
      type: "circle",
      source: "villages",
      layout: { visibility: mode === "pins" ? "visible" : "none" },
      paint: {
        "circle-radius": 10,
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "theftPct"],
          0, "#22c55e",
          0.1, "#eab308",
          0.2, "#ef4444",
        ],
        "circle-opacity": 0.8,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    })

    map.addLayer({
      id: "villages-heat",
      type: "heatmap",
      source: "villages",
      maxzoom: 15,
      layout: { visibility: mode === "heatmap" ? "visible" : "none" },
      paint: {
        "heatmap-weight": ["get", "theftPct"],
        "heatmap-intensity": 2,
        "heatmap-radius": 30,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(33, 197, 94, 0)",
          0.3, "rgba(234, 179, 8, 0.6)",
          0.6, "rgba(239, 68, 68, 0.8)"
        ],
      },
    })

    map.on("click", "villages-circle", (e) => {
      const f = e.features?.[0]
      if (!f) return
      const { name, users, anomalies, top } = f.properties as any
      new maplibregl.Popup().setLngLat((f.geometry as any).coordinates).setHTML(`
        <div style="font-family:ui-sans-serif,system-ui">
          <strong>${name}</strong><br/>
          Users: ${users}<br/>
          Anomalies: ${anomalies}<br/>
          Top anomaly: ${top}
        </div>
      `).addTo(map)
    })
    map.getCanvas().style.cursor = "pointer"
  })

  return () => map.remove()
}, [])

useEffect(() => {
  const map = mapRef.current
  if (!map || !isLoaded) return
  try {
    if (map.getLayer("villages-circle")) {
      map.setLayoutProperty("villages-circle", "visibility", mode === "pins" ? "visible" : "none")
    }
    if (map.getLayer("villages-heat")) {
      map.setLayoutProperty("villages-heat", "visibility", mode === "heatmap" ? "visible" : "none")
    }
  } catch (e) {
    // Silently ignore if style reloads between renders
    console.warn("Layer toggle skipped:", e)
  }
}, [mode, isLoaded])

return (
  <div className="space-y-6">
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Geo View</h1>
        <p className="text-muted-foreground">Color-coded by theft percentage. Click markers for details.</p>
      </div>
      <div className="flex gap-2">
        <Button variant={mode === "pins" ? "default" : "outline"} onClick={() => setMode("pins")}>
          <MapPin className="h-4 w-4 mr-2" /> Pins
        </Button>
        <Button variant={mode === "heatmap" ? "default" : "outline"} onClick={() => setMode("heatmap")}>
          <Flame className="h-4 w-4 mr-2" /> Heatmap
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Ankola & Nearby
        </CardTitle>
        <CardDescription>OpenStreetMap tiles via MapLibre</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full h-[520px] rounded-md overflow-hidden" />
      </CardContent>
    </Card>
  </div>
)
}
