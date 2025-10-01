import React, { useState, useEffect } from "react";
import { Layers, Save } from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";

export default function DesignTypeForm({
  designType = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (designType) {
        setFormData({
          name: designType.name || "",
        });
      } else {
        setFormData({
          name: "",
        });
      }
    }
  }, [isOpen, designType]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Design Type Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({ ...formData, id: designType?.id });
    } catch (error) {
      console.error("Error saving design type:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={designType ? "Edit Design Type" : "New Design Type"}
      subtitle="Manage design type categories"
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
            label={loading ? "Saving..." : "Save Design Type"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-4">
        <Form.Group>
          <Form.Label htmlFor="name" required>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Design Type Name
            </div>
          </Form.Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter design type name"
            error={!!errors.name}
          />
          <Form.Error>{errors.name}</Form.Error>
        </Form.Group>
      </div>
    </Modal>
  );
}
