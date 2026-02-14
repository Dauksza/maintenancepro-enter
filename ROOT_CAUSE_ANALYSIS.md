# Root Cause Analysis (RCA) System

## Overview

The Root Cause Analysis system is an advanced ML-powered feature that analyzes historical work order data to identify common failure patterns, equipment relationships, and recurring issues. This proactive approach helps maintenance teams understand **why** failures occur, not just **when** they happen.

---

## Key Features

### 1. **Pattern Recognition**
Automatically identifies recurring failure patterns across work orders using:
- Natural language processing to extract keywords from tasks and descriptions
- Similarity algorithms to group related failures
- Statistical analysis to determine pattern confidence and trends

**Key Metrics:**
- Pattern frequency (failures per month)
- Average downtime impact
- Typical priority level
- Confidence score (0-100%)
- Trend analysis (increasing, decreasing, stable)

### 2. **Failure Clustering**
Groups equipment failures by common characteristics:
- Equipment-specific failure clusters
- Common symptoms and root causes
- Recurring interval detection
- Resolution time analysis

**Cluster Analysis Includes:**
- Total downtime hours
- Average resolution time
- Recurring interval identification
- Root cause hypothesis generation
- Prevention strategy recommendations

### 3. **Causal Relationships**
Detects cascading failures between equipment:
- Identifies when failures in one piece of equipment lead to failures in another
- Calculates correlation strength
- Tracks time lag between related failures
- Provides concrete examples of causal chains

**Use Cases:**
- Upstream/downstream equipment dependencies
- Shared power or fluid systems
- Environmental factors affecting multiple assets

### 4. **Failure Timeline Analysis**
Tracks failure patterns over time:
- Detects failure acceleration (decreasing time between failures)
- Identifies critical periods with high failure rates
- Tracks time since last failure for each piece of equipment
- Provides visual timeline of all failures

**Warning Indicators:**
- 🔴 **Failure Acceleration**: Time between failures is decreasing
- ⚠️ **Critical Period**: Multiple failures in short time window

### 5. **Task Complexity Analysis**
Evaluates the difficulty and risk of different maintenance tasks:
- Complexity scoring based on multiple factors
- Average completion time tracking
- Failure rate calculation
- Multiple attempt detection

**Improvement Recommendations:**
- Procedure development needs
- Training requirements
- Spare parts staging
- Scheduling optimization

---

## How It Works

### Machine Learning Pipeline

1. **Data Collection**
   - Gathers all historical work orders
   - Extracts text from tasks and descriptions
   - Analyzes maintenance metadata (status, priority, downtime)

2. **Feature Extraction**
   - Keyword extraction using NLP techniques
   - Removes common stop words
   - Identifies maintenance-specific terminology

3. **Pattern Matching**
   - Calculates similarity between work orders
   - Groups similar failures using clustering algorithms
   - Identifies equipment, priority, and type correlations

4. **Statistical Analysis**
   - Calculates failure frequencies
   - Detects trends over time
   - Computes confidence scores
   - Identifies anomalies

5. **Hypothesis Generation**
   - Generates root cause hypotheses based on symptoms
   - Recommends prevention strategies
   - Suggests process improvements

---

## Pattern Types Detected

### Mechanical Failures
**Keywords:** wear, worn, damage, broken, crack, bearing, seal
**Typical Causes:**
- Component wear exceeding design life
- Improper lubrication
- Excessive load or vibration
- Environmental factors

**Prevention:**
- Reduce operating hours or cycles
- Use premium replacement parts
- Improve lubrication program
- Implement vibration monitoring

### Fluid System Issues
**Keywords:** leak, fluid, oil, hydraulic, drip, seep, pressure
**Typical Causes:**
- Seal degradation
- Fitting looseness
- Thermal cycling
- Vibration

**Prevention:**
- Upgrade to higher quality seals
- Implement weekly visual inspections
- Apply proper torque to fittings
- Install vibration dampeners

### Electrical Problems
**Keywords:** electrical, power, circuit, short, voltage, connection
**Typical Causes:**
- Connection corrosion
- Loose terminals
- Insulation breakdown
- Overheating

**Prevention:**
- Quarterly thermographic inspections
- Apply corrosion protection
- Verify proper grounding
- Check terminal tightness

### Calibration Drift
**Keywords:** calibrate, adjust, alignment, drift, accuracy
**Typical Causes:**
- Component aging
- Environmental factors
- Mechanical wear
- Electrical noise

**Prevention:**
- Increase calibration frequency
- Control environmental conditions
- Shield from electromagnetic interference
- Replace aging components

---

## Using the RCA Dashboard

### Navigation
1. Go to **Predictive ML** tab in main navigation
2. Select **Root Cause Analysis** sub-tab
3. View the overview dashboard showing:
   - Total patterns identified
   - Number of failure clusters
   - Causal relationships detected
   - Equipment with accelerating failures

### Pattern Analysis Tab

**View:**
- All identified failure patterns sorted by severity
- Pattern name and description
- Trend indicators (increasing/decreasing/stable)
- Occurrence count and frequency

**Click on a pattern to see:**
- Contributing factors
- Recommended prevention strategies
- Affected equipment list
- Common keywords
- Related work orders

**Action Items:**
- Review prevention recommendations
- Update maintenance procedures
- Adjust PM schedules
- Order recommended parts

### Cluster Analysis Tab

**View:**
- Equipment-specific failure clusters
- Total downtime and resolution time
- Recurring interval (if detected)
- Common symptoms

**Click on a cluster to see:**
- Root cause hypothesis
- Prevention strategies
- Detailed failure history

**Action Items:**
- Investigate root causes
- Implement prevention strategies
- Schedule proactive maintenance
- Train technicians on proper procedures

### Relationship Analysis Tab

**View:**
- Causal links between equipment
- Correlation strength (confidence)
- Time lag between failures
- Example occurrences

**Use this data to:**
- Plan coordinated maintenance
- Identify system-wide issues
- Prevent cascading failures
- Optimize maintenance scheduling

### Timeline Analysis Tab

**View:**
- Chronological failure history per equipment
- Time between failures
- Acceleration warnings
- Critical period alerts

**Look for:**
- 🔴 **Failure Acceleration**: Immediate action required
- ⚠️ **Critical Periods**: Multiple failures in short time
- Patterns in timing (seasonal, operational cycles)

**Action Items:**
- Address accelerating failures immediately
- Investigate critical period causes
- Adjust PM schedules based on actual failure intervals

### Complexity Analysis Tab

**View:**
- Task types ranked by complexity
- Average completion time
- Failure rates
- Common complications

**Use this data to:**
- Identify training needs
- Develop detailed procedures
- Pre-stage tools and parts
- Allocate appropriate resources

---

## Interpreting Confidence Scores

Confidence scores indicate how reliable the pattern analysis is:

- **90-100%**: Very high confidence - strong pattern with consistent data
- **70-89%**: High confidence - reliable pattern with good data
- **50-69%**: Moderate confidence - emerging pattern, continue monitoring
- **30-49%**: Low confidence - insufficient data or high variability
- **Below 30%**: Very low confidence - more data needed

**Factors affecting confidence:**
- Number of similar work orders
- Consistency of failure intervals
- Data quality and completeness
- Length of historical record

---

## Best Practices

### Data Quality
✅ **Do:**
- Provide detailed task descriptions
- Include symptoms and root causes in comments
- Update work orders with actual completion times
- Mark work orders completed when finished

❌ **Don't:**
- Use generic descriptions like "fix equipment"
- Leave fields blank
- Create duplicate work orders
- Cancel work orders without reason

### Analysis Frequency
- **Daily**: Check for new critical patterns
- **Weekly**: Review pattern trends
- **Monthly**: Analyze failure timelines
- **Quarterly**: Update prevention strategies

### Action Planning
1. **Immediate** (within 24 hours):
   - Address critical risk predictions
   - Investigate accelerating failures
   - Order parts for high-risk equipment

2. **Short-term** (1-2 weeks):
   - Implement prevention strategies
   - Update maintenance procedures
   - Schedule proactive maintenance

3. **Long-term** (1-3 months):
   - Analyze effectiveness of changes
   - Adjust strategies based on results
   - Document lessons learned

---

## Integration with Other Systems

### Predictive Maintenance
- Root cause patterns feed into failure prediction models
- Identified causes improve prediction accuracy
- Prevention strategies reduce predicted failure rates

### Work Order Management
- Click "View Related Work Orders" to see pattern history
- Create preventive work orders from recommendations
- Link new work orders to identified patterns

### Parts Inventory
- Prevention strategies suggest spare parts needs
- Part usage patterns correlate with failure patterns
- Proactive ordering based on predicted failures

### Employee Training
- Task complexity analysis identifies training needs
- Common complications guide procedure development
- Recommended improvements inform training programs

---

## Minimum Data Requirements

To generate meaningful root cause analysis:

**Minimum Requirements:**
- 5+ work orders total
- 3+ similar work orders for pattern detection
- 2+ historical occurrences per equipment for timeline analysis
- Completed work orders with dates for interval analysis

**Optimal Dataset:**
- 50+ work orders
- 6+ months of historical data
- Detailed task descriptions and comments
- Consistent data entry practices

---

## Troubleshooting

### "Insufficient Data" Message
**Cause:** Fewer than 5 work orders in system
**Solution:** Continue creating work orders; analysis will activate automatically

### No Patterns Detected
**Cause:** Work orders are too dissimilar
**Solution:** 
- Ensure consistent naming conventions
- Provide detailed descriptions
- Include common maintenance terminology

### Low Confidence Scores
**Cause:** High variability in data or limited history
**Solution:**
- Continue collecting data over time
- Improve consistency in work order creation
- Ensure all fields are filled out completely

### Missing Causal Relationships
**Cause:** Time lag detection requires specific conditions
**Solution:**
- Track failures within 30 days of each other
- Maintain consistent equipment naming
- Include upstream/downstream equipment context

---

## Technical Details

### Algorithms Used
- **Text Similarity**: Jaccard similarity coefficient for keyword matching
- **Clustering**: Density-based clustering with similarity thresholds
- **Time Series**: Interval analysis with trend detection
- **Correlation**: Temporal correlation analysis with lag detection

### Performance
- Analysis runs in-browser (no server required)
- Typical analysis time: 200-500ms for 100 work orders
- Results cached until data changes
- Scales well to 1000+ work orders

### Data Privacy
- All analysis runs locally in browser
- No data sent to external servers
- Results stored in browser storage only
- Clearing browser data removes analysis history

---

## Future Enhancements

Planned improvements to the RCA system:

1. **LLM Integration**
   - AI-powered root cause hypothesis generation
   - Natural language insights and recommendations
   - Automated report generation

2. **Advanced Analytics**
   - Seasonal pattern detection
   - Correlation with external factors (weather, production load)
   - Cost impact analysis

3. **Predictive Actions**
   - Automatic work order creation for high-risk patterns
   - Smart scheduling based on pattern analysis
   - Proactive parts ordering

4. **Team Collaboration**
   - Share pattern insights with team
   - Collaborative root cause investigation
   - Pattern confirmation workflow

---

## Support and Feedback

For questions or suggestions about the Root Cause Analysis system:
- Review related work orders to understand patterns
- Document your findings in work order comments
- Share successful prevention strategies with your team
- Continuously improve data quality for better insights

**Remember:** The quality of root cause analysis depends on the quality of your work order data. Detailed, consistent, and complete data leads to more accurate and actionable insights.
