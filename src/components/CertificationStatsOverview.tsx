import type { CertificationRenewalStats } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Certificate,
  Warning,
  CheckCircle,
  Clock,
  TrendUp,
  Users
} from '@phosphor-icons/react'

interface CertificationStatsOverviewProps {
  stats: CertificationRenewalStats
}

export function CertificationStatsOverview({ stats }: CertificationStatsOverviewProps) {
  const getComplianceRate = () => {
    if (stats.total_certifications === 0) return 0
    return Math.round(
      ((stats.total_certifications - stats.expired) / stats.total_certifications) * 100
    )
  }

  const complianceRate = getComplianceRate()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Certifications</CardTitle>
          <Certificate size={20} className="text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_certifications}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.up_to_date} up to date
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expired</CardTitle>
          <Warning size={20} className="text-destructive" weight="fill" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Require immediate action
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <Clock size={20} className="text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {stats.expiring_30_days + stats.expiring_60_days + stats.expiring_90_days}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Within 90 days
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {stats.expiring_30_days > 0 && (
              <Badge variant="destructive" className="text-xs">
                30d: {stats.expiring_30_days}
              </Badge>
            )}
            {stats.expiring_60_days > 0 && (
              <Badge className="text-xs bg-accent text-accent-foreground">
                60d: {stats.expiring_60_days}
              </Badge>
            )}
            {stats.expiring_90_days > 0 && (
              <Badge variant="secondary" className="text-xs">
                90d: {stats.expiring_90_days}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
          {complianceRate >= 90 ? (
            <CheckCircle size={20} className="text-green-600" weight="fill" />
          ) : (
            <Warning size={20} className="text-accent" weight="fill" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            complianceRate >= 90 ? 'text-green-600' : 
            complianceRate >= 75 ? 'text-accent' : 
            'text-destructive'
          }`}>
            {complianceRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {complianceRate >= 90 ? 'Excellent' : complianceRate >= 75 ? 'Good' : 'Needs attention'}
          </p>
        </CardContent>
      </Card>

      {stats.by_category.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendUp size={20} />
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.by_category.map((category) => (
                <div key={category.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex gap-2">
                      {category.expired > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {category.expired} expired
                        </Badge>
                      )}
                      {category.expiring > 0 && (
                        <Badge className="text-xs bg-accent text-accent-foreground">
                          {category.expiring} expiring
                        </Badge>
                      )}
                      <span className="text-muted-foreground">
                        {category.total} total
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${((category.total - category.expired - category.expiring) / category.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.by_employee.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users size={20} />
              Employees Requiring Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {stats.by_employee.slice(0, 10).map((emp) => (
                <div
                  key={emp.employee_id}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                >
                  <span className="font-medium">{emp.employee_name}</span>
                  <div className="flex gap-2">
                    {emp.expired_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {emp.expired_count} expired
                      </Badge>
                    )}
                    {emp.expiring_count > 0 && (
                      <Badge className="text-xs bg-accent text-accent-foreground">
                        {emp.expiring_count} expiring
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.recent_renewals.length > 0 && (
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Recent Renewals (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stats.recent_renewals.map((renewal, idx) => (
                <div
                  key={`${renewal.employee_id}-${renewal.skill_name}-${idx}`}
                  className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                >
                  <div>
                    <div className="font-medium">{renewal.skill_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(renewal.renewed_date).toLocaleDateString()}
                    </div>
                  </div>
                  <CheckCircle size={16} className="text-green-600" weight="fill" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
