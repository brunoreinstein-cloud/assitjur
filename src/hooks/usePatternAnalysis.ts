import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PatternAnalysisService } from '@/lib/services/pattern-analysis'
import type { AnalysisResult, AnalysisRequest } from '@/types/mapa-testemunhas-analysis'
import { filterPatternsByRelevance, getCriticalPatterns, generatePatternInsights, calculateCaseRiskScore } from '@/lib/utils/pattern-utils'

/**
 * Hook for pattern analysis operations with caching and state management
 */
export function usePatternAnalysis() {
  const queryClient = useQueryClient()
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null)

  // Main analysis query
  const {
    data: analysisResult,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['pattern-analysis'],
    queryFn: () => PatternAnalysisService.runAnalysis(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Store last successful analysis
  useEffect(() => {
    if (analysisResult) {
      setLastAnalysis(analysisResult)
    }
  }, [analysisResult])

  // Mutation for custom analysis requests
  const analysisMutation = useMutation({
    mutationFn: (request: AnalysisRequest) => PatternAnalysisService.runAnalysis(request),
    onSuccess: (data) => {
      setLastAnalysis(data)
      // Update cache
      queryClient.setQueryData(['pattern-analysis'], data)
    }
  })

  // Specific pattern analysis mutations
  const patternAnalysisMutation = useMutation({
    mutationFn: (patterns: ('trocaDireta' | 'triangulacao' | 'duploPapel' | 'provaEmprestada' | 'homonimos')[]) => 
      PatternAnalysisService.analyzePatterns(patterns),
    onSuccess: (data) => setLastAnalysis(data)
  })

  const caseAnalysisMutation = useMutation({
    mutationFn: (cnjs: string[]) => PatternAnalysisService.analyzeSpecificCases(cnjs),
    onSuccess: (data) => setLastAnalysis(data)
  })

  const periodAnalysisMutation = useMutation({
    mutationFn: ({ inicio, fim }: { inicio: string, fim: string }) => 
      PatternAnalysisService.analyzeByPeriod(inicio, fim),
    onSuccess: (data) => setLastAnalysis(data)
  })

  // Computed values based on current analysis
  const currentAnalysis = analysisResult || lastAnalysis
  
  const summary = currentAnalysis ? PatternAnalysisService.extractSummary(currentAnalysis) : null
  
  const filteredPatterns = currentAnalysis ? filterPatternsByRelevance(currentAnalysis) : null
  
  const criticalPatterns = currentAnalysis ? getCriticalPatterns(currentAnalysis) : null
  
  const insights = currentAnalysis ? generatePatternInsights(currentAnalysis) : []
  
  const riskAssessment = currentAnalysis ? calculateCaseRiskScore(currentAnalysis) : null

  // Analysis functions
  const runFullAnalysis = async (request?: AnalysisRequest) => {
    if (request) {
      return analysisMutation.mutateAsync(request)
    } else {
      const result = await refetch()
      return result.data
    }
  }

  const analyzePatterns = async (patterns: ('trocaDireta' | 'triangulacao' | 'duploPapel' | 'provaEmprestada' | 'homonimos')[]) => {
    return patternAnalysisMutation.mutateAsync(patterns)
  }

  const analyzeSpecificCases = async (cnjs: string[]) => {
    return caseAnalysisMutation.mutateAsync(cnjs)
  }

  const analyzeByPeriod = async (inicio: string, fim: string) => {
    return periodAnalysisMutation.mutateAsync({ inicio, fim })
  }

  const formatForReport = (analysis?: AnalysisResult) => {
    const dataToFormat = analysis || currentAnalysis
    return dataToFormat ? PatternAnalysisService.formatForReport(dataToFormat) : null
  }

  const refreshAnalysis = () => {
    queryClient.invalidateQueries({ queryKey: ['pattern-analysis'] })
    return refetch()
  }

  // Loading states
  const isAnalyzing = isLoading || 
                     analysisMutation.isPending || 
                     patternAnalysisMutation.isPending || 
                     caseAnalysisMutation.isPending || 
                     periodAnalysisMutation.isPending

  const analysisError = error || 
                       analysisMutation.error || 
                       patternAnalysisMutation.error || 
                       caseAnalysisMutation.error || 
                       periodAnalysisMutation.error

  return {
    // Data
    analysisResult: currentAnalysis,
    summary,
    filteredPatterns,
    criticalPatterns,
    insights,
    riskAssessment,
    
    // States
    isLoading: isAnalyzing,
    error: analysisError,
    
    // Actions
    runFullAnalysis,
    analyzePatterns,
    analyzeSpecificCases,
    analyzeByPeriod,
    formatForReport,
    refreshAnalysis,
    
    // Utilities
    hasData: !!currentAnalysis,
    hasCriticalIssues: criticalPatterns ? Object.values(criticalPatterns).some(arr => arr.length > 0) : false,
    totalPatterns: summary?.totalPatterns || 0,
    criticalCount: summary?.criticalIssues || 0
  }
}

/**
 * Hook for specific pattern type analysis
 */
export function useSpecificPatternAnalysis(patternType: 'trocaDireta' | 'triangulacao' | 'duploPapel' | 'provaEmprestada' | 'homonimos') {
  const { analyzePatterns, isLoading, error } = usePatternAnalysis()
  
  const {
    data,
    mutate,
    isPending
  } = useMutation({
    mutationFn: () => analyzePatterns([patternType])
  })

  const runAnalysis = () => mutate()

  return {
    data: data?.[patternType] || [],
    runAnalysis,
    isLoading: isLoading || isPending,
    error
  }
}

/**
 * Hook for real-time pattern monitoring
 */
export function usePatternMonitoring(intervalMs = 30000) {
  const { refreshAnalysis, criticalCount, hasData } = usePatternAnalysis()
  const [previousCriticalCount, setPreviousCriticalCount] = useState<number | null>(null)
  const [hasNewCriticalIssues, setHasNewCriticalIssues] = useState(false)

  useEffect(() => {
    if (!hasData) return

    const interval = setInterval(() => {
      refreshAnalysis()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [hasData, intervalMs, refreshAnalysis])

  useEffect(() => {
    if (previousCriticalCount !== null && criticalCount > previousCriticalCount) {
      setHasNewCriticalIssues(true)
    }
    setPreviousCriticalCount(criticalCount)
  }, [criticalCount, previousCriticalCount])

  const clearNewIssuesFlag = () => {
    setHasNewCriticalIssues(false)
  }

  return {
    hasNewCriticalIssues,
    criticalCount,
    clearNewIssuesFlag
  }
}