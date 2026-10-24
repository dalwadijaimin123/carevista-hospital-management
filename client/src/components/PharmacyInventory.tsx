import { useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Loader2,
  Package,
  PackagePlus,
  Pill,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InventoryUnit =
  | "tablets"
  | "capsules"
  | "bottles"
  | "vials"
  | "boxes"
  | "packs"
  | "strips"
  | "pieces"
  | "units"
  | "ml"
  | "litres";

type InventoryRecord = {
  id: string;
  itemName: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  status: "in_stock" | "low_stock" | "out_of_stock" | string;
  updatedAt?: Date | string;
};

type PharmacyForm = {
  itemName: string;
  sku: string;
  category: string;
  quantity: string;
  reorderLevel: string;
  unit: InventoryUnit;
};

const emptyForm: PharmacyForm = {
  itemName: "",
  sku: "",
  category: "Medicine",
  quantity: "0",
  reorderLevel: "10",
  unit: "boxes",
};

const categories = [
  "Medicine",
  "Antibiotic",
  "Consumables",
  "Diabetes care",
  "First aid",
  "Surgical supplies",
  "Personal protective equipment",
  "Other",
];

const units: InventoryUnit[] = [
  "tablets",
  "capsules",
  "bottles",
  "vials",
  "boxes",
  "packs",
  "strips",
  "pieces",
  "units",
  "ml",
  "litres",
];

function statusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClasses(status: string): string {
  if (status === "out_of_stock") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status === "low_stock") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

export default function PharmacyInventory({
  inventory,
}: {
  inventory?: InventoryRecord[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<PharmacyForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [itemToDelete, setItemToDelete] = useState<InventoryRecord | null>(null);
  const utils = trpc.useUtils();

  const refreshInventory = async () => {
    await Promise.all([
      utils.admin.inventory.invalidate(),
      utils.admin.overview.invalidate(),
    ]);
  };

  const addItemMutation = trpc.admin.addInventoryItem.useMutation({
    onSuccess: async () => {
      await refreshInventory();
      setDialogOpen(false);
      setFormError("");
      setForm(emptyForm);
      toast.success("Inventory item added successfully.");
    },
    onError: (error) => setFormError(error.message),
  });

  const deleteItemMutation = trpc.admin.deleteInventoryItem.useMutation({
    onSuccess: async () => {
      await refreshInventory();
      setItemToDelete(null);
      toast.success("Inventory item deleted successfully.");
    },
    onError: (error) => {
      toast.error(error.message || "Unable to delete this inventory item.");
    },
  });

  const rows = inventory ?? [];
  const lowStockCount = rows.filter((row) => row.status === "low_stock").length;
  const outOfStockCount = rows.filter((row) => row.status === "out_of_stock").length;

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      [row.itemName, row.sku, row.category, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [rows, search]);

  const quantity = Number(form.quantity || 0);
  const reorderLevel = Number(form.reorderLevel || 0);
  const previewStatus =
    quantity === 0
      ? "out_of_stock"
      : quantity <= reorderLevel
        ? "low_stock"
        : "in_stock";

  const updateForm = (key: keyof PharmacyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
  };

  const handleAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    addItemMutation.mutate({
      itemName: form.itemName.trim(),
      sku: form.sku.trim() || undefined,
      category: form.category.trim(),
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      unit: form.unit,
    });
  };

  return (
    <>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="rounded-2xl border-[#e3eae3] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#71827a]">Inventory items</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5f3ed] text-[#0d796f]"><Boxes className="h-4 w-4" /></span>
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-[#183d38]">{rows.length}</div>
            <p className="mt-1 text-[11px] text-[#95a098]">Total recorded products</p>
          </Card>
          <Card className="rounded-2xl border-[#f4e3c8] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8b7355]">Low stock</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle className="h-4 w-4" /></span>
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-[#8d5a1b]">{lowStockCount}</div>
            <p className="mt-1 text-[11px] text-[#a58d72]">At or below reorder level</p>
          </Card>
          <Card className="rounded-2xl border-[#f0d9d5] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8c6c67]">Out of stock</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Package className="h-4 w-4" /></span>
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-rose-700">{outOfStockCount}</div>
            <p className="mt-1 text-[11px] text-[#a58b87]">Items requiring replenishment</p>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-2xl border-[#e3e9e1] bg-white shadow-[0_8px_26px_rgba(22,53,50,.04)]">
          <div className="flex flex-col gap-4 border-b border-[#edf0e9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e4f2eb] text-[#0d796f]"><Pill className="h-5 w-5" /></span>
              <div>
                <h2 className="display-font text-lg font-extrabold tracking-[-.03em] text-[#183d38]">Pharmacy inventory</h2>
                <p className="mt-1 max-w-lg text-xs leading-5 text-[#8b9a92]">Track medicine and supply levels, catch shortages early, and keep your stock list up to date.</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                setFormError("");
                setForm(emptyForm);
                setDialogOpen(true);
              }}
              className="h-10 shrink-0 rounded-xl bg-[#0d6e65] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#09584f]"
            >
              <PackagePlus className="mr-2 h-4 w-4" /> Add item
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#f0f2ed] bg-[#fcfdfb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa69f]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by item, SKU, or category..."
                aria-label="Search pharmacy inventory"
                className="h-10 rounded-xl border-[#e1e8e0] bg-white pl-9 text-xs shadow-none focus-visible:ring-[#8fcfc2]"
              />
            </div>
            <p className="text-[11px] font-medium text-[#8e9c94]">
              Showing <span className="font-bold text-[#34534c]">{filteredRows.length}</span> of {rows.length} items
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead className="bg-[#fbfcfa]">
                <tr className="border-b border-[#edf0e9] text-[10px] font-bold uppercase tracking-[.12em] text-[#8d9a93]">
                  <th className="px-5 py-3.5">Item details</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">On hand</th>
                  <th className="px-3 py-3.5">Reorder at</th>
                  <th className="px-3 py-3.5">Stock status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2ed]">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="group text-xs text-[#557068] transition-colors hover:bg-[#f9fcf9]">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#294d45]">{row.itemName}</div>
                      <div className="mt-1 text-[10px] text-[#9ca8a2]">SKU {row.sku}</div>
                    </td>
                    <td className="px-3 py-4">{row.category}</td>
                    <td className="px-3 py-4 font-bold text-[#34534c]">{row.quantity} <span className="font-medium text-[#8b9a92]">{row.unit}</span></td>
                    <td className="px-3 py-4">{row.reorderLevel} {row.unit}</td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusClasses(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={`Delete ${row.itemName}`}
                        aria-label={`Delete ${row.itemName}`}
                        disabled={deleteItemMutation.isPending}
                        onClick={() => setItemToDelete(row)}
                        className="h-9 w-9 rounded-xl border-rose-100 text-rose-600 opacity-100 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:opacity-70 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5f0] text-[#6e9484]"><Package className="h-5 w-5" /></div>
                      <p className="mt-3 text-sm font-bold text-[#47665c]">{rows.length === 0 ? "Your inventory is empty" : "No matching items found"}</p>
                      <p className="mt-1 text-xs text-[#95a39b]">{rows.length === 0 ? "Add your first medicine or supply to start tracking stock." : "Try a different item name, SKU, or category."}</p>
                      {rows.length === 0 && (
                        <Button type="button" onClick={() => setDialogOpen(true)} className="mt-4 rounded-xl bg-[#0d6e65] text-xs font-bold text-white hover:bg-[#09584f]">
                          <PackagePlus className="mr-2 h-4 w-4" /> Add first item
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!addItemMutation.isPending) setDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-2xl">
          <div className="rounded-t-3xl bg-gradient-to-br from-[#0d6e65] via-[#155f56] to-[#19453f] px-6 py-6 text-white sm:px-8">
            <div className="flex items-start gap-4 pr-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><PackagePlus className="h-6 w-6" /></div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-100/80">Pharmacy management</div>
                <DialogHeader className="mt-1 space-y-1 text-left">
                  <DialogTitle className="display-font text-2xl font-extrabold tracking-tight text-white">Add inventory item</DialogTitle>
                  <DialogDescription className="max-w-lg text-xs leading-5 text-emerald-50/80">
                    Enter the product details and starting stock. The item will be saved to the database and shown in the inventory table.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddItem} className="space-y-6 p-5 sm:p-8">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e5f3ed] text-[11px] font-extrabold text-[#0d796f]">1</span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#254b43]">Product details</h3>
                  <p className="mt-0.5 text-[11px] text-[#93a198]">Basic identification and classification</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor="pharmacy-item-name" className="space-y-2 text-xs font-bold text-[#4d655c]">
                  Item name <span className="text-rose-600">*</span>
                  <Input
                    id="pharmacy-item-name"
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.itemName}
                    onChange={(event) => updateForm("itemName", event.target.value)}
                    placeholder="e.g. Paracetamol 500mg"
                    className="h-11 rounded-xl border-[#dce6df] bg-white text-sm shadow-sm placeholder:text-[#b5c0b9] focus-visible:border-[#0d796f] focus-visible:ring-[#0d796f]/20"
                  />
                </label>
                <label htmlFor="pharmacy-item-sku" className="space-y-2 text-xs font-bold text-[#4d655c]">
                  SKU / product code <span className="font-medium text-[#9aa79f]">(optional)</span>
                  <Input
                    id="pharmacy-item-sku"
                    maxLength={80}
                    value={form.sku}
                    onChange={(event) => updateForm("sku", event.target.value)}
                    placeholder="Auto-generated if left blank"
                    className="h-11 rounded-xl border-[#dce6df] bg-white text-sm shadow-sm placeholder:text-[#b5c0b9] focus-visible:border-[#0d796f] focus-visible:ring-[#0d796f]/20"
                  />
                </label>
                <label htmlFor="pharmacy-item-category" className="space-y-2 text-xs font-bold text-[#4d655c]">
                  Category <span className="text-rose-600">*</span>
                  <select
                    id="pharmacy-item-category"
                    required
                    value={form.category}
                    onChange={(event) => updateForm("category", event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dce6df] bg-white px-3 text-sm font-medium text-[#35564c] shadow-sm outline-none transition focus:border-[#0d796f] focus:ring-2 focus:ring-[#0d796f]/15"
                  >
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label htmlFor="pharmacy-item-unit" className="space-y-2 text-xs font-bold text-[#4d655c]">
                  Stock unit <span className="text-rose-600">*</span>
                  <select
                    id="pharmacy-item-unit"
                    required
                    value={form.unit}
                    onChange={(event) => updateForm("unit", event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dce6df] bg-white px-3 text-sm font-medium text-[#35564c] shadow-sm outline-none transition focus:border-[#0d796f] focus:ring-2 focus:ring-[#0d796f]/15"
                  >
                    {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e6eee7] bg-[#f8fbf8] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[11px] font-extrabold text-[#0d796f] shadow-sm ring-1 ring-[#e2ebe3]">2</span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#254b43]">Stock control</h3>
                  <p className="mt-0.5 text-[11px] text-[#93a198]">Set the opening quantity and alert threshold</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor="pharmacy-item-quantity" className="space-y-2 text-xs font-bold text-[#4d655c]">
                  Opening quantity <span className="text-rose-600">*</span>
                  <Input
                    id="pharmacy-item-quantity"
                    required
                    type="number"
                    min={0}
                    max={10000000}
                    step={1}
                    value={form.quantity}
                    onChange={(event) => updateForm("quantity", event.target.value)}
                    className="h-11 rounded-xl border-[#dce6df] bg-white text-sm shadow-sm focus-visible:border-[#0d796f] focus-visible:ring-[#0d796f]/20"
                  />
                  <span className="block text-[10px] font-normal leading-4 text-[#92a097]">Current amount available in pharmacy.</span>
                </label>
                <label htmlFor="pharmacy-item-reorder" className="space-y-2 text-xs font-bold text-[#4d655c]">
                  Reorder level <span className="text-rose-600">*</span>
                  <Input
                    id="pharmacy-item-reorder"
                    required
                    type="number"
                    min={0}
                    max={10000000}
                    step={1}
                    value={form.reorderLevel}
                    onChange={(event) => updateForm("reorderLevel", event.target.value)}
                    className="h-11 rounded-xl border-[#dce6df] bg-white text-sm shadow-sm focus-visible:border-[#0d796f] focus-visible:ring-[#0d796f]/20"
                  />
                  <span className="block text-[10px] font-normal leading-4 text-[#92a097]">Show a low-stock warning at this level.</span>
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#90a097]">Status preview</div>
                  <p className="mt-1 text-[11px] text-[#71867c]">Status will be set automatically based on your stock values.</p>
                </div>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold ring-1 ring-inset ${statusClasses(previewStatus)}`}>
                  {previewStatus === "in_stock" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {statusLabel(previewStatus)}
                </span>
              </div>
            </section>

            {formError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <DialogFooter className="flex-col-reverse gap-2 border-t border-[#edf1ec] pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={addItemMutation.isPending}
                onClick={() => setDialogOpen(false)}
                className="h-11 rounded-xl border-[#dce5dd] px-5 text-xs font-bold text-[#60756c] hover:bg-[#f7faf6]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addItemMutation.isPending}
                className="h-11 rounded-xl bg-[#0d6e65] px-6 text-xs font-extrabold text-white shadow-sm hover:bg-[#09584f]"
              >
                {addItemMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving inventory...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Save inventory item</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteItemMutation.isPending) setItemToDelete(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[440px] overflow-hidden rounded-3xl border border-[#f0d9d7] bg-white p-0 shadow-[0_24px_80px_rgba(24,61,56,0.24)] sm:max-w-md">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#fff0ef] via-[#fff8f7] to-white px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-rose-100/70" />
            <div className="pointer-events-none absolute right-12 top-16 h-10 w-10 rounded-full bg-white/70" />
            <AlertDialogHeader className="relative space-y-0 text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-600 shadow-sm">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-600">
                Confirm inventory removal
              </div>
              <AlertDialogTitle className="mt-2 text-xl font-extrabold tracking-tight text-[#183d38] sm:text-2xl">
                Delete this item?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm leading-6 text-[#71827a]">
                You are about to permanently remove this product from the pharmacy inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <div className="space-y-3 px-6 py-5 sm:px-7">
            <div className="rounded-2xl border border-[#e8eee8] bg-[#fbfdfb] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f2ec] text-[#0d796f]">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-extrabold text-[#254b43]">
                    {itemToDelete?.itemName ?? "Selected inventory item"}
                  </p>
                  <p className="mt-1 break-all text-[11px] text-[#8b9a92]">
                    SKU: {itemToDelete?.sku || "Not assigned"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-[#e4ebe4] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#65796f]">
                      {itemToDelete?.category || "Uncategorized"}
                    </span>
                    {itemToDelete && (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusClasses(itemToDelete.status)}`}>
                        {statusLabel(itemToDelete.status)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#526a60]">
                    Current stock: {itemToDelete?.quantity ?? 0} {itemToDelete?.unit ?? "units"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] leading-5 text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>This action cannot be undone. The item will be removed from the database and the inventory summary will refresh after deletion.</p>
            </div>
          </div>

          <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-[#edf0e9] bg-[#fcfdfb] px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
            <AlertDialogCancel
              disabled={deleteItemMutation.isPending}
              className="h-11 rounded-xl border-[#dce5dd] bg-white px-5 text-xs font-bold text-[#60756c] shadow-sm hover:bg-[#f5f8f4]"
            >
              Keep item
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteItemMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (itemToDelete) deleteItemMutation.mutate({ id: itemToDelete.id });
              }}
              className="h-11 rounded-xl bg-rose-600 px-5 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500"
            >
              {deleteItemMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete item</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
