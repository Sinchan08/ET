// FILE: app/api/admin/geo-data/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

// We'll hard-code the coordinates here and merge them with live DB data.
// These are from your 'app/admin/geo/page.tsx' file.
const villageCoordinates: { [key: string]: [number, number] } = {
  "Ankola": [74.3040, 14.6620],
  "Belambar": [74.3910, 14.7560],
  "Hankon": [74.3290, 14.7850],
  // You can add more villages/addresses here as needed
};

export async function GET() {
  try {
    // --- THIS QUERY IS NOW FIXED ---
    // 1. Join data_records with users on rrno to get the address.
    // 2. Group by the address (which we are treating as the village).
    const query = `
      SELECT
        u.address AS village,
        COUNT(d.id) AS total_records,
        COUNT(d.id) FILTER (WHERE d.is_anomaly = true) AS total_anomalies
      FROM data_records d
      JOIN users u ON d.rrno = u.rrno
      WHERE u.address IS NOT NULL
      GROUP BY u.address;
    `;
    
    const { rows } = await db.query(query);

    // Now, merge the query results with our hard-coded coordinates
    const geoData = rows.map(row => {
      // The 'village' field from our query is actually the 'address'
      const villageName = row.village;
      const coords = villageCoordinates[villageName];
      
      const totalRecords = parseInt(row.total_records, 10);
      const totalAnomalies = parseInt(row.total_anomalies, 10);
      const theftPct = totalRecords > 0 ? (totalAnomalies / totalRecords) : 0;

      return {
        type: "Feature",
        properties: {
          name: villageName,
          users: totalRecords, // Using total records
          anomalies: totalAnomalies,
          theftPct: theftPct,
          top: theftPct > 0.1 ? "Consumption Spike" : "Power Factor Issue", // Mock 'top' anomaly
        },
        geometry: {
          type: "Point",
          // Default to Ankola if address doesn't match our hard-coded list
          coordinates: coords || [74.30, 14.66] 
        }
      };
    });

    return NextResponse.json({ type: "FeatureCollection", features: geoData });

  } catch (error) {
    console.error('API Error fetching geo data:', error);
    return NextResponse.json({ error: 'Failed to fetch geo data' }, { status: 500 });
  }
}