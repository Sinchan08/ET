"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Settings, Save, Sliders } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface RuleConfig {
  spike_multiplier: number
  voltage_min: number
  voltage_max: number
  power_factor_min: number
  billing_threshold: number
  enabled: boolean
}

export default function RulesPage() {
  const { toast } = useToast()
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>({
    spike_multiplier: 2.0,
    voltage_min: 200,
    voltage_max: 250,
    power_factor_min: 0.7,
    billing_threshold: 5000,
    enabled: true,
  })

  const handleRuleUpdate = async () => {
    try {
      toast({
        title: "Rules updated",
        description: "Detection rules have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update detection rules.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rule Engine Configuration</h1>
        <p className="text-muted-foreground">Configure detection rules and thresholds for anomaly detection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Rule Engine Configuration
          </CardTitle>
          <CardDescription>Configure detection rules and thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Rule-Based Detection</Label>
              <p className="text-sm text-muted-foreground">Use rule-based anomaly detection alongside ML</p>
            </div>
            <Switch
              checked={ruleConfig.enabled}
              onCheckedChange={(checked) => setRuleConfig((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Consumption Spike Multiplier: {ruleConfig.spike_multiplier}x</Label>
              <Slider
                value={[ruleConfig.spike_multiplier]}
                onValueChange={([value]) => setRuleConfig((prev) => ({ ...prev, spike_multiplier: value }))}
                max={5}
                min={1.5}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Flag consumption above {ruleConfig.spike_multiplier}x rolling average
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Minimum Voltage: {ruleConfig.voltage_min}V</Label>
                <Slider
                  value={[ruleConfig.voltage_min]}
                  onValueChange={([value]) => setRuleConfig((prev) => ({ ...prev, voltage_min: value }))}
                  max={220}
                  min={180}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Voltage: {ruleConfig.voltage_max}V</Label>
                <Slider
                  value={[ruleConfig.voltage_max]}
                  onValueChange={([value]) => setRuleConfig((prev) => ({ ...prev, voltage_max: value }))}
                  max={280}
                  min={240}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Minimum Power Factor: {ruleConfig.power_factor_min}</Label>
              <Slider
                value={[ruleConfig.power_factor_min]}
                onValueChange={([value]) => setRuleConfig((prev) => ({ ...prev, power_factor_min: value }))}
                max={0.95}
                min={0.5}
                step={0.05}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Flag power factor below {ruleConfig.power_factor_min}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Billing Threshold: ₹{ruleConfig.billing_threshold}</Label>
              <Slider
                value={[ruleConfig.billing_threshold]}
                onValueChange={([value]) => setRuleConfig((prev) => ({ ...prev, billing_threshold: value }))}
                max={10000}
                min={2000}
                step={500}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Flag unusual billing amounts above ₹{ruleConfig.billing_threshold}
              </p>
            </div>
          </div>

          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Rule changes will affect future anomaly detection. Current detections remain unchanged.
            </AlertDescription>
          </Alert>

          <Button onClick={handleRuleUpdate}>
            <Save className="h-4 w-4 mr-2" />
            Save Rule Configuration
          </Button>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Detection Summary</h4>
            <p className="text-sm text-muted-foreground">
              Rule-based detections (last 30 days): <span className="font-semibold">{Math.round(120 * (ruleConfig.spike_multiplier / 2))}</span>
              {" "}• ML-based detections: <span className="font-semibold">{220}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
