import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertTriangle, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import type { ProcessoScore, TestemunhaScore, ScoreBreakdown } from '@/types/scoring'
import { SCORE_RANGES } from '@/types/scoring'

interface ScoreDisplayProps {
  score: ProcessoScore | TestemunhaScore
  showBreakdown?: boolean
  compact?: boolean
}

export function ScoreDisplay({ score, showBreakdown = false, compact = false }: ScoreDisplayProps) {
  const scoreRange = SCORE_RANGES.find(range => 
    score.score_final >= range.min && score.score_final <= range.max
  ) || SCORE_RANGES[SCORE_RANGES.length - 1]

  const getScoreIcon = () => {
    if (score.score_final >= 85) return <AlertCircle className="h-4 w-4 text-destructive" />
    if (score.score_final >= 70) return <AlertTriangle className="h-4 w-4 text-destructive" />
    if (score.score_final >= 50) return <Info className="h-4 w-4 text-warning" />
    if (score.score_final >= 30) return <Shield className="h-4 w-4 text-success" />
    return <CheckCircle className="h-4 w-4 text-muted-foreground" />
  }

  const getRecommendationSeverity = () => {
    if ('prioridade_contradita' in score) {
      const priority = score.prioridade_contradita
      if (priority === 'URGENTE') return 'destructive'
      if (priority === 'ALTA') return 'destructive'
      if (priority === 'MEDIA') return 'warning'
      return 'secondary'
    }
    return 'secondary'
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {getScoreIcon()}
              <Badge variant={scoreRange.color as any} className="font-mono">
                {score.score_final}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{scoreRange.label}</p>
              <p className="text-xs text-muted-foreground">
                Score: {score.score_final}/100
              </p>
              {'fatores_risco' in score && score.fatores_risco && score.fatores_risco.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium">Fatores de Risco:</p>
                  <ul className="list-disc list-inside">
                    {score.fatores_risco.slice(0, 3).map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getScoreIcon()}
            <span>Score de Risco</span>
          </div>
          <Badge variant={scoreRange.color as any} className="font-mono text-lg">
            {score.score_final}/100
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Nível de Risco</span>
            <span className="font-medium">{scoreRange.label}</span>
          </div>
          <Progress 
            value={score.score_final} 
            className={`w-full h-2 ${scoreRange.color === 'destructive' ? '[&>div]:bg-destructive' : scoreRange.color === 'warning' ? '[&>div]:bg-orange-500' : '[&>div]:bg-primary'}`}
          />
        </div>

        {/* Strategic Classification */}
        {'classificacao_estrategica' in score && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Classificação:</strong> {score.classificacao_estrategica}
            </AlertDescription>
          </Alert>
        )}

        {/* Testemunha specific info */}
        {'classificacao' in score && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Classificação:</span>
            <Badge variant="outline">
              {score.classificacao}
            </Badge>
          </div>
        )}

        {/* Risk Factors */}
        {'fatores_risco' in score && score.fatores_risco && score.fatores_risco.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Fatores de Risco:</h4>
            <ul className="space-y-1">
              {score.fatores_risco.map((factor, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {score.score_breakdown.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recomendações:</h4>
            <ul className="space-y-1">
              {score.score_breakdown.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Score Breakdown */}
        {showBreakdown && (
          <ScoreBreakdownDisplay breakdown={score.score_breakdown} />
        )}

        {/* Special Alerts */}
        {'alerta_prova_emprestada' in score && score.alerta_prova_emprestada && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Alerta:</strong> Testemunha profissional detectada. 
              Verificar se é testemunha técnica antes de contraditar.
            </AlertDescription>
          </Alert>
        )}

        {'prioridade_contradita' in score && score.prioridade_contradita === 'NAO_RECOMENDADA' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Contradita não recomendada. 
              Pode ser testemunha técnica legítima.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

interface ScoreBreakdownDisplayProps {
  breakdown: ScoreBreakdown
}

function ScoreBreakdownDisplay({ breakdown }: ScoreBreakdownDisplayProps) {
  const components = Object.entries(breakdown.components)

  if (components.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Nenhum fator de risco detectado
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Decomposição do Score:</h4>
      
      <div className="space-y-2">
        {components.map(([key, component]) => {
          const contributionScore = Math.round(component.score * component.weight)
          const percentage = breakdown.total > 0 ? (contributionScore / breakdown.total) * 100 : 0
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {component.score} × {(component.weight * 100).toFixed(0)}%
                  </span>
                  <Badge variant="outline" className="min-w-[40px] justify-center">
                    {contributionScore}
                  </Badge>
                </div>
              </div>
              
              <Progress value={percentage} className="h-1" />
              
              {component.description && (
                <p className="text-xs text-muted-foreground pl-2">
                  {component.description}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t">
        <div className="flex justify-between items-center font-medium">
          <span>Total</span>
          <Badge variant="secondary" className="text-lg">
            {breakdown.total}/100
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Quick score badge component for tables
export function ScoreBadge({ score, showTooltip = true }: { score: number, showTooltip?: boolean }) {
  const scoreRange = SCORE_RANGES.find(range => 
    score >= range.min && score <= range.max
  ) || SCORE_RANGES[SCORE_RANGES.length - 1]

  const badge = (
    <Badge 
      variant={scoreRange.color as any} 
      className="font-mono min-w-[50px] justify-center"
    >
      {scoreRange.icon} {score}
    </Badge>
  )

  if (!showTooltip) return badge

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{scoreRange.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}