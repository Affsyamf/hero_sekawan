import React, { useState, useEffect } from "react";
import { Building2, FileText, Phone, Save } from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";

export default function SupplierForm({
  supplier = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contact_info: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (supplier) {
        // Edit mode
        setFormData({
          code: supplier.code || "",
          name: supplier.name || "",
          contact_info: supplier.contact_info || "",
        });
      } else {
        // Create mode
        setFormData({
          code: "",
          name: "",
          contact_info: "",
        });
      }
    }
  }, [isOpen, supplier]);

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

    if (!formData.code.trim()) {
      newErrors.code = "Supplier Code is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Supplier Name is required";
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
      await onSave({ ...formData, id: supplier?.id });
    } catch (error) {
      console.error("Error saving supplier:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? "Edit Supplier" : "New Supplier"}
      subtitle="Manage supplier information and contact details"
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
            label={loading ? "Saving..." : "Save Supplier"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-4">
        <Form.Group>
          <Form.Label htmlFor="code" required>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Supplier Code
            </div>
          </Form.Label>
          <Input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange("code", e.target.value)}
            placeholder="Enter supplier code (e.g., SUP-001)"
            error={!!errors.code}
          />
          <Form.Error>{errors.code}</Form.Error>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="name" required>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Supplier Name
            </div>
          </Form.Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter supplier name"
            error={!!errors.name}
          />
          <Form.Error>{errors.name}</Form.Error>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="contact_info">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary" />
              Contact Info
            </div>
          </Form.Label>
          <textarea
            id="contact_info"
            value={formData.contact_info}
            onChange={(e) => handleInputChange("contact_info", e.target.value)}
            placeholder="Enter contact information (phone, email, address, etc.)"
            rows="4"
            className="w-full px-3 py-2 text-sm transition-all duration-200 border rounded-lg resize-none bg-surface text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/40 border-default"
          />
        </Form.Group>
      </div>
    </Modal>
  );
}
