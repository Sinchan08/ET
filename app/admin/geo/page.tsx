// FILE: app/admin/geo/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Map, Flame, MapPin } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import { cn } from "@/lib/utils" // <-- ADD THIS LINE

// --- REMOVED THE HARD-CODED 'VILLAGES' CONSTANT ---

export default function GeoPage() {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<"pins" | "heatmap">("pins")
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true) // <-- Add loading state
  const [geoData, setGeoData] = useState<any>(null) // <-- State for our data

  // --- ADD useEffect to fetch data ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/geo-data');
        if (!response.ok) {
          throw new Error('Failed to fetch geo data');
        }
        const data = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error(error);
        // You can add a toast here
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- UPDATE this useEffect to use the fetched 'geoData' ---
  useEffect(() => {
    // Wait until the map container is ready AND we have data
    if (mapRef.current || !containerRef.current || !geoData) return;
    
    const map = new maplibregl.Map({
    container: containerRef.current,
    style: "https://demotiles.maplibre.org/style.json",
    center: [74.35, 14.72],
    zoom: 10,
})
    mapRef.current = map

    map.on("load", () => {
      setIsLoaded(true)
      map.addSource("villages", {
        type: "geojson",
        data: geoData, // <-- Use fetched data here
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
            Records: ${users}<br/>
            Anomalies: ${anomalies}<br/>
            Top anomaly: ${top}
          </div>
        `).addTo(map)
      })
      map.getCanvas().style.cursor = "pointer"
    })

    return () => map.remove()
  }, [geoData]) // <-- Re-run this effect when geoData arrives

  // This effect for toggling layers remains unchanged
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
      console.warn("Layer toggle skipped:", e)
    }
  }, [mode, isLoaded])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geo View</h1>
          <p className="text-muted-foreground">Color-coded by anomaly percentage. Click markers for details.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "pins" ? "default" : "outline"} onClick={() => setMode("pins")}>
            <MapPin className="h-4 w-4 mr-2" /> Pins
          </Button>
          <Button variant={mode ==="heatmap" ? "default" : "outline"} onClick={() => setMode("heatmap")}>
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
          <CardDescription>Live anomaly data from database</CardDescription>
        </CardHeader>
        <CardContent>
          {/* --- Add loading skeleton --- */}
          {loading && (
            <Skeleton className="w-full h-[520px] rounded-md" />
          )}
          {/* This div will be hidden by the skeleton while loading */}
          <div 
            ref={containerRef} 
            className={cn(
              "w-full h-[520px] rounded-md overflow-hidden",
              loading && "hidden" // Hide map container while loading
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}