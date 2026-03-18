import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { z } from "zod"
import { schema } from "@/components/data-table-schema"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { GripVerticalIcon, Columns3Icon, ChevronDownIcon, PlusIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, TrendingUpIcon } from "lucide-react"

export function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-white/35 hover:bg-transparent hover:text-white/70"
    >
      <GripVerticalIcon className="size-3 text-white/35" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-white">{row.original.name}</span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "offering",
    header: "Offering",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="border-white/10 bg-white/[0.03] px-1.5 text-white/70">
          {row.original.offering}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "purchaseDate",
    header: "Purchase Date",
    cell: ({ row }) => (
      <span className="text-white/80">{row.original.purchaseDate}</span>
    ),
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => (
      <span className="text-white/80">{row.original.country}</span>
    ),
  },
  {
    accessorKey: "purchaseCount",
    header: "Customer Type",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={`px-1.5 ${row.original.purchaseCount > 1 ? "border-blue-400/20 bg-blue-400/10 text-blue-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}
      >
        {row.original.purchaseCount > 1 ? `Repeated (${row.original.purchaseCount}x)` : "New Customer"}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="w-full text-right">Amount (₹)</div>,
    cell: ({ row }) => (
      <div className="w-full text-right text-white/80 font-medium">
        ₹{row.original.amount.toLocaleString()}
      </div>
    ),
  },
]

function DraggableRow({ row, onRowClick }: { row: Row<z.infer<typeof schema>>, onRowClick: (item: z.infer<typeof schema>) => void }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      onClick={() => onRowClick(row.original)}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 cursor-pointer hover:bg-white/5"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedItem, setSelectedItem] = React.useState<z.infer<typeof schema> | null>(null)
  const isMobile = useIsMobile()
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <>
      <Tabs
        defaultValue="outline"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="outline">
            <SelectTrigger
              className="flex w-fit border-white/10 bg-[#0f172a] text-white @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f172a] text-white">
              <SelectGroup>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="past-performance">Past Performance</SelectItem>
                <SelectItem value="key-personnel">Key Personnel</SelectItem>
                <SelectItem value="focus-documents">Focus Documents</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <TabsList className="hidden rounded-2xl border border-white/10 bg-[#17181b] p-1.5 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-white/20 **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger className="text-white/60 data-[state=active]:bg-white/14 data-[state=active]:text-white" value="outline">Subscribers</TabsTrigger>
            <TabsTrigger className="text-white/60 data-[state=active]:bg-white/14 data-[state=active]:text-white" value="past-performance">
              Pending Renewals <Badge variant="secondary" className="bg-white/20 text-white">3</Badge>
            </TabsTrigger>
            <TabsTrigger className="text-white/60 data-[state=active]:bg-white/14 data-[state=active]:text-white" value="key-personnel">
              Active Coaches <Badge variant="secondary" className="bg-white/20 text-white">2</Badge>
            </TabsTrigger>
            <TabsTrigger className="text-white/60 data-[state=active]:bg-white/14 data-[state=active]:text-white" value="focus-documents">Course Resources</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/12 bg-[#0e0f12] text-white hover:bg-white/5 hover:text-white">
                  <Columns3Icon data-icon="inline-start" />
                  Columns
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 border-white/10 bg-[#0f172a] text-white">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="border-white/12 bg-[#0e0f12] text-white hover:bg-white/5 hover:text-white">
              <PlusIcon
              />
              <span className="hidden lg:inline">Add User</span>
            </Button>
          </div>
        </div>
        <TabsContent
          value="outline"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#17181b] shadow-[0_18px_55px_rgba(0,0,0,0.32)]">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan} className="text-white">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} onRowClick={setSelectedItem} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-white/60"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <div className="flex items-center justify-between px-4 text-white/70">
            <div className="hidden flex-1 text-sm text-white/45 lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium text-white/70">
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" className="w-20 border-white/10 bg-[#0f172a] text-white" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top" className="border-white/10 bg-[#0f172a] text-white">
                    <SelectGroup>
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium text-white/70">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 border-white/10 bg-[#0e0f12] p-0 text-white hover:bg-white/5 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeftIcon
                  />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 border-white/10 bg-[#0e0f12] text-white hover:bg-white/5"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeftIcon
                  />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 border-white/10 bg-[#0e0f12] text-white hover:bg-white/5"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRightIcon
                  />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 border-white/10 bg-[#0e0f12] text-white hover:bg-white/5 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRightIcon
                  />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent
          value="past-performance"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed border-white/10 bg-white/[0.02]"></div>
        </TabsContent>
        <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed border-white/10 bg-white/[0.02]"></div>
        </TabsContent>
        <TabsContent
          value="focus-documents"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed border-white/10 bg-white/[0.02]"></div>
        </TabsContent>
      </Tabs>
      <Drawer
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
        direction={isMobile ? "bottom" : "right"}
      >
        <DrawerContent className="border-white/10 bg-[#0f172a] text-white">
          {selectedItem && (
            <>
              <DrawerHeader className="gap-1">
                <DrawerTitle className="text-white">{selectedItem.name}</DrawerTitle>
                <DrawerDescription className="text-white/60">
                  Showing platform engagement for {selectedItem.name}
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                {!isMobile && (
                  <>
                    <ChartContainer config={chartConfig}>
                      <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                          left: 0,
                          right: 10,
                        }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(0, 3)}
                          hide
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                          dataKey="mobile"
                          type="natural"
                          fill="var(--color-mobile)"
                          fillOpacity={0.6}
                          stroke="var(--color-mobile)"
                          stackId="a"
                        />
                        <Area
                          dataKey="desktop"
                          type="natural"
                          fill="var(--color-desktop)"
                          fillOpacity={0.4}
                          stroke="var(--color-desktop)"
                          stackId="a"
                        />
                      </AreaChart>
                    </ChartContainer>
                    <Separator />
                    <div className="grid gap-2">
                      <div className="flex gap-2 leading-none font-medium">
                        Trending up by 5.2% this month{" "}
                        <TrendingUpIcon className="size-4" />
                      </div>
                      <div className="text-white/55">
                        Showing overall engagement metrics over the last 6 months for {selectedItem.name}.
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                <form className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="name" className="text-white/70">Name</Label>
                    <Input id="name" defaultValue={selectedItem.name} className="border-white/10 bg-black/30 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="offering" className="text-white/70">Offering</Label>
                      <Input id="offering" defaultValue={selectedItem.offering} className="border-white/10 bg-black/30 text-white" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="purchaseDate" className="text-white/70">Purchase Date</Label>
                      <Input id="purchaseDate" defaultValue={selectedItem.purchaseDate} className="border-white/10 bg-black/30 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="amount" className="text-white/70">Amount (₹)</Label>
                      <Input id="amount" defaultValue={selectedItem.amount} type="number" className="border-white/10 bg-black/30 text-white" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="country" className="text-white/70">Country</Label>
                      <Input id="country" defaultValue={selectedItem.country} className="border-white/10 bg-black/30 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="purchaseCount" className="text-white/70">Purchase Count</Label>
                    <Input id="purchaseCount" defaultValue={selectedItem.purchaseCount} type="number" className="border-white/10 bg-black/30 text-white" />
                  </div>
                </form>
              </div>
              <DrawerFooter>
                <Button className="bg-blue-500 text-slate-950 hover:bg-blue-400" onClick={() => setSelectedItem(null)}>Submit</Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="border-white/10 bg-black/20 text-white hover:bg-white/5">Done</Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig
