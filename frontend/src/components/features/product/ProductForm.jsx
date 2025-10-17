import { BookOpen, FileText, Package, Ruler, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { searchAccount } from "../../../services/account_service";
import Button from "../../ui/button/Button";
import DropdownServer from "../../ui/dropdown-server/DropdownServer";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Modal from "../../ui/modal/Modal";

export default function ProductForm({
  product = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    unit: "",
    account_id: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Memoized account options
  // const accountOptions = useMemo(() => {
  //   return accountsInTemp.map((x) => ({
  //     id: x.id,
  //     name: x.name,
  //     code: x.code || `ACC-${x.id}`,
  //   }));
  // }, [accountsInTemp]);

  // Initialize form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (product) {
        // Edit mode
        setFormData({
          code: product.code || "",
          name: product.name || "",
          unit: product.unit || "",
          account_id: product.account_id || "",
        });
      } else {
        // Create mode
        setFormData({
          code: "",
          name: "",
          unit: "",
          account_id: "",
        });
      }
    }
  }, [isOpen, product]);

  // Form input handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Pass data ke parent untuk disimpan
      await onSave({ ...formData, id: product?.id });
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reusable input class generator
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
      title={product ? "Edit Product" : "New Product"}
      subtitle="Manage product information and account association"
      size="md"
      actions={
        <>
          <Button
            label="Cancel"
            onClick={onClose}
            disabled={loading}
            className="bg-transparent border border-default text-secondary-text hover:bg-background hover:text-primary-text"
          />
          <Button
            icon={Save}
            label={loading ? "Saving..." : "Save Product"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-4">
        <Form.Group>
          <Form.Label htmlFor="code">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Product Code
            </div>
          </Form.Label>
          <Input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange("code", e.target.value)}
            placeholder="Enter product code (optional)"
            error={!!errors.code}
          />
          <Form.Error>{errors.code}</Form.Error>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="name" required>
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" />
              Product Name
            </div>
          </Form.Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter product name"
            error={!!errors.name}
          />
          <Form.Error>{errors.name}</Form.Error>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="unit">
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-primary" />
              Unit
            </div>
          </Form.Label>
          <Input
            id="unit"
            type="text"
            value={formData.unit}
            onChange={(e) => handleInputChange("unit", e.target.value)}
            placeholder="Enter unit (e.g., Pcs, Kg, Box, etc.)"
          />
          {/* <Form.Helper>Unit of measurement for this product</Form.Helper> */}
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="account_id">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Account
            </div>
          </Form.Label>
          <DropdownServer
            apiService={searchAccount}
            placeholder="Ketik untuk mencari account..."
            onChange={(selectedValue) =>
              handleInputChange("account_id", selectedValue)
            }
            value={formData.account_id}
            contentItem="name"
            valueKey="id" // ✅ Return hanya ID
            displayKey="name" // ✅ Tampilkan name di input
            name="account_id"
          />
        </Form.Group>
      </div>
    </Modal>
  );
}
