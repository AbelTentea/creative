"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ExportHistoryType } from "@/lib/types"
import { FileDown, Eye, BarChart, Calendar, CalendarIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n/language-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

export function ExportHistory() {
  const { t } = useLanguage()
  const [exports, setExports] = useState<ExportHistoryType[]>([])
  const [filteredExports, setFilteredExports] = useState<ExportHistoryType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewingExport, setViewingExport] = useState<ExportHistoryType | null>(null)
  const [userStats, setUserStats] = useState<{ username: string; count: number; total: number }[]>([])
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    fetchExports()
  }, [])

  useEffect(() => {
    // Filter exports based on selected period or date range
    if (exports.length > 0) {
      let filtered = [...exports]
      const now = new Date()

      if (periodFilter === "custom" && startDate) {
        // Custom date range filter
        const end = endDate || new Date()
        end.setHours(23, 59, 59, 999) // Set to end of day

        filtered = exports.filter((exp) => {
          const date = new Date(exp.createdAt)
          return date >= startDate && date <= end
        })
      } else if (periodFilter === "today") {
        filtered = exports.filter((exp) => {
          const date = new Date(exp.createdAt)
          return date.toDateString() === now.toDateString()
        })
      } else if (periodFilter === "week") {
        const weekAgo = new Date()
        weekAgo.setDate(now.getDate() - 7)

        filtered = exports.filter((exp) => {
          const date = new Date(exp.createdAt)
          return date >= weekAgo
        })
      } else if (periodFilter === "month") {
        const monthAgo = new Date()
        monthAgo.setMonth(now.getMonth() - 1)

        filtered = exports.filter((exp) => {
          const date = new Date(exp.createdAt)
          return date >= monthAgo
        })
      } else if (periodFilter === "year") {
        const yearAgo = new Date()
        yearAgo.setFullYear(now.getFullYear() - 1)

        filtered = exports.filter((exp) => {
          const date = new Date(exp.createdAt)
          return date >= yearAgo
        })
      }

      setFilteredExports(filtered)

      // Calculate stats per user for filtered exports
      const stats = {}
      filtered.forEach((exp) => {
        if (!stats[exp.username]) {
          stats[exp.username] = { count: 0, total: 0 }
        }
        stats[exp.username].count += 1
        stats[exp.username].total += exp.exportData.totalPrice
      })

      // Convert to array for display
      const statsArray = Object.keys(stats).map((username) => ({
        username,
        count: stats[username].count,
        total: stats[username].total,
      }))

      setUserStats(statsArray)
    }
  }, [exports, periodFilter, startDate, endDate])

  const fetchExports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/exports")
      const data = await response.json()
      setExports(data)
      setFilteredExports(data)
    } catch (error) {
      console.error("Error fetching exports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Find the maximum values for scaling the charts
  const maxExportCount = userStats.length > 0 ? Math.max(...userStats.map((s) => s.count)) : 0
  const maxExportTotal = userStats.length > 0 ? Math.max(...userStats.map((s) => s.total)) : 0

  const handlePeriodChange = (value: string) => {
    setPeriodFilter(value)
    if (value !== "custom") {
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileDown className="h-6 w-6" />
              <span>{t("exportHistory")}</span>
            </CardTitle>
            <CardDescription>{t("viewExportHistory")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              <span>Export List</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Statistics</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="period-filter" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t("filterByPeriod")}</span>
              </Label>
              <Select value={periodFilter} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTime")}</SelectItem>
                  <SelectItem value="today">{t("today")}</SelectItem>
                  <SelectItem value="week">{t("lastWeek")}</SelectItem>
                  <SelectItem value="month">{t("lastMonth")}</SelectItem>
                  <SelectItem value="year">{t("lastYear")}</SelectItem>
                  <SelectItem value="custom">{t("customDateRange")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodFilter === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>{t("startDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>{t("pickDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t("endDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>{t("pickDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => (startDate ? date < startDate : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>

          <TabsContent value="list">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("exportDate")}</TableHead>
                      <TableHead>{t("exportedBy")}</TableHead>
                      <TableHead>{t("companyName")}</TableHead>
                      <TableHead>{t("totalPrice")}</TableHead>
                      <TableHead>{t("products")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {t("noExportsFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExports.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>{formatDate(exp.createdAt)}</TableCell>
                          <TableCell>{exp.username}</TableCell>
                          <TableCell>{exp.exportData.companyName || "-"}</TableCell>
                          <TableCell>{formatCurrency(exp.exportData.totalPrice)}</TableCell>
                          <TableCell>{exp.exportData.selectedProducts.length}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setViewingExport(exp)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Export Statistics by User</h3>

              {userStats.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No export data available</div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Number of Exports</h4>
                    <div className="space-y-2">
                      {userStats.map((stat) => (
                        <div key={`count-${stat.username}`} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{stat.username}</span>
                            <span className="text-sm font-medium">{stat.count}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${(stat.count / maxExportCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Total Value of Exports</h4>
                    <div className="space-y-2">
                      {userStats.map((stat) => (
                        <div key={`total-${stat.username}`} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{stat.username}</span>
                            <span className="text-sm font-medium">{formatCurrency(stat.total)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${(stat.total / maxExportTotal) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={viewingExport !== null} onOpenChange={() => setViewingExport(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{t("exportDetails")}</DialogTitle>
            </DialogHeader>
            {viewingExport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">{t("exportDate")}:</p>
                    <p>{formatDate(viewingExport.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t("exportedBy")}:</p>
                    <p>{viewingExport.username}</p>
                  </div>
                </div>

                {viewingExport.exportData.companyName && (
                  <div>
                    <p className="text-sm font-medium">{t("companyName")}:</p>
                    <p>{viewingExport.exportData.companyName}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium mb-2">{t("selectedProducts")}</h3>
                  {viewingExport.exportData.selectedProducts.length === 0 ? (
                    <p className="text-muted-foreground">{t("noProductsSelected")}</p>
                  ) : (
                    <div className="space-y-4">
                      {viewingExport.exportData.selectedProducts.map((item, index) => (
                        <div key={index} className="border rounded-md p-3">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <p>
                              <span className="font-medium">{t("dimensions")}:</span> {item.width} cm × {item.height} cm
                            </p>
                            <p>
                              <span className="font-medium">{t("area")}:</span> {item.squareMeters.toFixed(2)} m²
                            </p>
                            <p>
                              <span className="font-medium">{t("price")}:</span> {formatCurrency(item.price)}
                            </p>
                          </div>

                          {/* Show extras */}
                          {item.selectedExtras && item.selectedExtras.length > 0 && item.product.extras && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">{t("extras")}:</p>
                              <ul className="text-sm ml-4">
                                {item.selectedExtras.map((extraId) => {
                                  const extra = item.product.extras.find((e) => e.id === extraId)
                                  return extra ? (
                                    <li key={extra.id}>
                                      {extra.name} - {formatCurrency(Number(extra.price))}
                                      {extra.pricePerSquareMeter ? ` ${t("perSquareMeter")}` : ""}
                                    </li>
                                  ) : null
                                })}
                              </ul>
                            </div>
                          )}

                          {/* Show custom features */}
                          {item.customFeatures && item.customFeatures.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">{t("customFeatures")}:</p>
                              <ul className="text-sm ml-4">
                                {item.customFeatures.map((feature) => (
                                  <li key={feature.id}>
                                    {feature.name} - {formatCurrency(feature.price)}
                                    {feature.isPricePerSquareMeter ? ` ${t("perSquareMeter")}` : ""}
                                    {feature.isPricePerSquareMeter &&
                                      feature.width &&
                                      feature.height &&
                                      ` (${feature.width} cm × ${feature.height} cm)`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 flex justify-between font-medium">
                  <span>{t("totalPrice")}:</span>
                  <span>{formatCurrency(viewingExport.exportData.totalPrice)}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

