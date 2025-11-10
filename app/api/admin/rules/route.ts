// FILE: app/api/admin/rules/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET function to read the current rules
export async function GET() {
  try {
    // Always fetch the settings row with id = 1
    const { rows } = await db.query('SELECT * FROM rule_settings WHERE id = 1');
    
    if (rows.length === 0) {
      // This shouldn't happen if you ran the SQL from Step 5.1
      return NextResponse.json({ error: 'Settings row not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error('API Error fetching rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

// POST function to update the rules
export async function POST(request: Request) {
  try {
    const rules = await request.json();

    const {
      spike_multiplier,
      voltage_min,
      voltage_max,
      power_factor_min,
      billing_threshold,
      enabled
    } = rules;

    // Use UPSERT (Update or Insert) to be safe
    const query = `
      INSERT INTO rule_settings (
        id, spike_multiplier, voltage_min, voltage_max, 
        power_factor_min, billing_threshold, enabled
      )
      VALUES (1, $1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        spike_multiplier = $1,
        voltage_min = $2,
        voltage_max = $3,
        power_factor_min = $4,
        billing_threshold = $5,
        enabled = $6
      RETURNING *
    `;
    
    const values = [
      spike_multiplier, voltage_min, voltage_max, 
      power_factor_min, billing_threshold, enabled
    ];
    
    const { rows } = await db.query(query, values);

    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error('API Error updating rules:', error);
    return NextResponse.json({ error: 'Failed to update rules' }, { status: 500 });
  }
}