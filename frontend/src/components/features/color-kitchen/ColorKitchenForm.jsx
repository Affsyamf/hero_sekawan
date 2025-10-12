import React, { useState, useEffect, useMemo } from "react";
import {
  Palette,
  Calendar,
  FileText,
  Package,
  Droplet,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";
import { searchDesign } from "../../../services/design_service";
import DropdownServer from "../../ui/dropdown-server/DropdownServer";
import { searchProduct } from "../../../services/product_service";

export default function ColorKitchenForm({
  entry = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    code: "",
    date: new Date().toISOString().split("T")[0],
    design_id: "",
    quantity: 0,
    paste_quantity: 0,
  });
  const [details, setDetails] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (entry) {
        setFormData({
          code: entry.code || "",
          date:
            entry.date?.split("T")[0] || new Date().toISOString().split("T")[0],
          design_id: entry.design_id || "",
          quantity: entry.quantity || 0,
          paste_quantity: entry.paste_quantity || 0,
        });
        setDetails(entry.details || []);
      } else {
        setFormData({
          code: "",
          date: new Date().toISOString().split("T")[0],
          design_id: "",
          quantity: 0,
          paste_quantity: 0,
        });
        setDetails([]);
      }
    }
  }, [isOpen, entry]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddDetail = () => {
    setDetails((prev) => [
      ...prev,
      {
        id: Date.now(),
        product_id: "",
        quantity: 0,
      },
    ]);
  };

  const handleRemoveDetail = (detailId) => {
    setDetails((prev) => prev.filter((detail) => detail.id !== detailId));
  };

  const handleUpdateDetail = (detailId, field, value) => {
    setDetails((prev) =>
      prev.map((detail) => {
        if (detail.id === detailId) {
          return { ...detail, [field]: value };
        }
        return detail;
      })
    );
  };

  const summary = useMemo(() => {
    const totalItems = details.length;
    const totalQuantity = details.reduce(
      (sum, d) => sum + (parseFloat(d.quantity) || 0),
      0
    );

    return { totalItems, totalQuantity };
  }, [details]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "No OPJ is required";
    }

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    if (!formData.design_id) {
      newErrors.design_id = "Design is required";
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    if (!formData.paste_quantity || formData.paste_quantity <= 0) {
      newErrors.paste_quantity = "Valid paste quantity is required";
    }

    if (details.length === 0) {
      newErrors.details = "At least one product detail is required";
    }

    details.forEach((detail, index) => {
      if (!detail.product_id) {
        newErrors[`detail_product_${index}`] = "Product is required";
      }
      if (!detail.quantity || detail.quantity <= 0) {
        newErrors[`detail_quantity_${index}`] = "Valid quantity is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({ ...formData, details, id: entry?.id });
    } catch (error) {
      console.error("Error saving color kitchen entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = (field) => `
    w-full px-3 py-2 rounded-lg border transition-all duration-200 
    bg-surface text-primary-text placeholder-secondary-text text-sm
    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
    hover:border-primary/40
    ${
      errors[field]
        ? "border-danger focus:ring-danger/20 focus:border-danger"
        : "border-default"
    }
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? "Edit Color Kitchen Entry" : "New Color Kitchen Entry"}
      subtitle="Manage color kitchen entries with design and product details"
      size="xl"
      showFullscreenToggle={true}
      actions={
        <>
          <Button
            label="Cancel"
            onClick={onClose}
            disabled={loading}
            className="bg-transparent border border-default text-secondary-text hover:bg-background hover:text-primary-text"
          />
          <Button
            icon={Palette}
            label={loading ? "Saving..." : "Save Entry"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Group>
            <Form.Label htmlFor="code" required>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                No OPJ
              </div>
            </Form.Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="Enter OPJ number"
              error={!!errors.code}
            />
            <Form.Error>{errors.code}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="date" required>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Date
              </div>
            </Form.Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              error={!!errors.date}
            />
            <Form.Error>{errors.date}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="design_id">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-primary" />
                Design
              </div>
            </Form.Label>
            <DropdownServer
              apiService={searchDesign}
              placeholder="Ketik untuk mencari design..."
              onChange={(selectedId) =>
                handleInputChange("design_id", selectedId)
              }
              value={formData.design_id}
              contentItem="name"
              valueKey="id" // ✅ Return hanya ID
              displayKey="name" // ✅ Tampilkan name di input
              name="design_id"
            />
            <Form.Error>{errors.design_id}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="quantity" required>
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                Quantity
              </div>
            </Form.Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              placeholder="Enter quantity"
              error={!!errors.quantity}
            />
            <Form.Error>{errors.quantity}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="paste_quantity" required>
              <div className="flex items-center gap-2">
                <Droplet className="w-3.5 h-3.5 text-primary" />
                Paste Quantity
              </div>
            </Form.Label>
            <Input
              id="paste_quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.paste_quantity}
              onChange={(e) =>
                handleInputChange("paste_quantity", e.target.value)
              }
              placeholder="Enter paste quantity"
              error={!!errors.paste_quantity}
            />
            <Form.Error>{errors.paste_quantity}</Form.Error>
          </Form.Group>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-primary-text">
              <Package className="w-4 h-4 text-primary" />
              Product Details
            </h3>
            <Button icon={Plus} label="Add Product" onClick={handleAddDetail} />
          </div>

          {errors.details && (
            <p className="flex items-center text-xs text-danger">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.details}
            </p>
          )}

          <div className="overflow-x-auto border rounded-lg border-default">
            <table className="w-full text-sm">
              <thead className="border-b bg-background/50 border-default">
                <tr>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Product
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Quantity
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-center uppercase text-secondary-text">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {details.map((detail, index) => (
                  <tr
                    key={detail.id}
                    className="transition-colors duration-150 hover:bg-background/30"
                  >
                    <td className="p-3">
                      <DropdownServer
                        apiService={searchProduct}
                        placeholder="Select Product"
                        value={detail.product_id}
                        onChange={(productId) =>
                          handleUpdateDetail(detail.id, "product_id", productId)
                        }
                        name="detail.product_id"
                        valueKey="id"
                        displayKey="name"
                        contentItem="name"
                      />
                      {errors[`detail_product_${index}`] && (
                        <p className="mt-1 text-xs text-danger">
                          {errors[`detail_product_${index}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        size="sm"
                        value={detail.quantity}
                        onChange={(e) =>
                          handleUpdateDetail(
                            detail.id,
                            "quantity",
                            e.target.value
                          )
                        }
                        placeholder="Quantity"
                        error={!!errors[`detail_quantity_${index}`]}
                      />
                      {errors[`detail_quantity_${index}`] && (
                        <p className="mt-1 text-xs text-danger">
                          {errors[`detail_quantity_${index}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveDetail(detail.id)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded transition-all duration-200"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {details.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="p-8 text-center text-secondary-text"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-secondary-text/50" />
                        <p className="text-sm">No products added yet</p>
                        <p className="text-xs">Click "Add Product" to start</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {details.length > 0 && (
          <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
              <Package className="w-3.5 h-3.5" />
              Entry Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-secondary-text">Total Items:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {summary.totalItems}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">
                  Total Detail Quantity:
                </span>
                <span className="ml-2 font-medium text-primary">
                  {summary.totalQuantity}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
