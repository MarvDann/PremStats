import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { DataTable, type Column } from './DataTable'

interface TestData {
  id: number
  name: string
  score: number
  active: boolean
}

const testData: TestData[] = [
  { id: 1, name: 'Arsenal', score: 75, active: true },
  { id: 2, name: 'Manchester City', score: 77, active: true },
  { id: 3, name: 'Liverpool', score: 68, active: false }
]

const testColumns: Column<TestData>[] = [
  {
    key: 'id',
    header: 'ID',
    accessor: (item) => item.id,
    sortable: true,
    align: 'center'
  },
  {
    key: 'name',
    header: 'Team',
    accessor: (item) => item.name,
    sortable: true,
    align: 'left'
  },
  {
    key: 'score',
    header: 'Points',
    accessor: (item) => item.score,
    sortable: true,
    align: 'right'
  },
  {
    key: 'active',
    header: 'Status',
    accessor: (item) => item.active ? 'Active' : 'Inactive',
    sortable: false,
    align: 'center'
  }
]

describe('DataTable', () => {
  it('renders table with data', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
      />
    ))

    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Arsenal')).toBeInTheDocument()
    expect(screen.getByText('Manchester City')).toBeInTheDocument()
    expect(screen.getByText('Liverpool')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
      />
    ))

    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Points')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders data in correct cells', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
      />
    ))

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('77')).toBeInTheDocument()
    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('applies default styling', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        data-testid="table"
      />
    ))

    const table = screen.getByTestId('table')
    expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm')
  })

  it('applies striped variant', () => {
    render(() => (
      <DataTable
        variant="striped"
        data={testData}
        columns={testColumns}
        data-testid="table"
      />
    ))

    const table = screen.getByTestId('table')
    expect(table).toHaveClass('[&_tbody_tr:nth-child(odd)]:bg-muted/50')
  })

  it('shows sort icons when sortable', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        sortable={true}
      />
    ))

    // Should have sort icons for sortable columns
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(4)
  })

  it('handles sorting by numeric column', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        sortable={true}
      />
    ))

    const pointsHeader = screen.getByText('Points').closest('th')
    expect(pointsHeader).toBeInTheDocument()

    // Click to sort ascending
    fireEvent.click(pointsHeader!)

    // Check that data is sorted (Liverpool 68, Arsenal 75, Man City 77)
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Liverpool')
    expect(rows[2]).toHaveTextContent('Arsenal')
    expect(rows[3]).toHaveTextContent('Manchester City')
  })

  it('handles sorting by string column', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        sortable={true}
      />
    ))

    const nameHeader = screen.getByText('Team').closest('th')
    expect(nameHeader).toBeInTheDocument()

    // Click to sort ascending
    fireEvent.click(nameHeader!)

    // Check alphabetical order (Arsenal, Liverpool, Manchester City)
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Arsenal')
    expect(rows[2]).toHaveTextContent('Liverpool')
    expect(rows[3]).toHaveTextContent('Manchester City')
  })

  it('toggles sort direction', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        sortable={true}
      />
    ))

    const pointsHeader = screen.getByText('Points').closest('th')
    expect(pointsHeader).toBeInTheDocument()

    // Click to sort ascending
    fireEvent.click(pointsHeader!)
    let rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Liverpool') // 68 points (lowest)

    // Click again to sort descending
    fireEvent.click(pointsHeader!)
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Manchester City') // 77 points (highest)
  })

  it('resets sort when clicking third time', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        sortable={true}
      />
    ))

    const pointsHeader = screen.getByText('Points').closest('th')
    expect(pointsHeader).toBeInTheDocument()

    // Original order
    let rows = screen.getAllByRole('row')
    const originalFirstTeam = rows[1].textContent

    // Click to sort ascending
    fireEvent.click(pointsHeader!)
    
    // Click to sort descending  
    fireEvent.click(pointsHeader!)
    
    // Click third time to reset
    fireEvent.click(pointsHeader!)
    
    rows = screen.getAllByRole('row')
    expect(rows[1].textContent).toBe(originalFirstTeam)
  })

  it('does not sort when sortable is false', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        sortable={false}
      />
    ))

    const pointsHeader = screen.getByText('Points').closest('th')
    expect(pointsHeader).toBeInTheDocument()

    // Original order
    let rows = screen.getAllByRole('row')
    const originalOrder = rows[1].textContent

    // Click header
    fireEvent.click(pointsHeader!)
    
    // Order should remain the same
    rows = screen.getAllByRole('row')
    expect(rows[1].textContent).toBe(originalOrder)
  })

  it('applies custom class names', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        class="custom-table"
        data-testid="table"
      />
    ))

    const table = screen.getByTestId('table')
    expect(table).toHaveClass('custom-table')
  })

  it('forwards HTML attributes', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
        id="league-table"
        role="table"
        data-testid="table"
      />
    ))

    const table = screen.getByTestId('table')
    expect(table).toHaveAttribute('id', 'league-table')
    expect(table).toHaveAttribute('role', 'table')
  })

  it('handles empty data', () => {
    render(() => (
      <DataTable
        data={[]}
        columns={testColumns}
      />
    ))

    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.queryByText('Arsenal')).not.toBeInTheDocument()
  })

  it('applies column alignment classes', () => {
    render(() => (
      <DataTable
        data={testData}
        columns={testColumns}
      />
    ))

    const headers = screen.getAllByRole('columnheader')
    expect(headers[0]).toHaveClass('text-center') // ID column
    expect(headers[1]).toHaveClass('text-left')   // Team column
    expect(headers[2]).toHaveClass('text-right')  // Points column
    expect(headers[3]).toHaveClass('text-center') // Status column
  })
})