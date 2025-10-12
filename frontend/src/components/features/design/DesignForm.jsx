import React, { useState, useEffect, useMemo } from "react";
import { Palette, FileText, Layers, Save, BookOpen } from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";
import { useTemp } from "../../../hooks/useTemp";
import { searchDesign } from "../../../services/design_service";
import DropdownServer from "../../ui/dropdown-server/DropdownServer";
import { searchDesignType } from "../../../services/design_type_service";

export default function DesignForm({ design = null, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    code: "",
    type_id: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (design) {
        setFormData({
          code: design.code || "",
          type_id: design.type_id || "",
        });
      } else {
        setFormData({
          code: "",
          type_id: "",
        });
      }
    }
  }, [isOpen, design]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Design Code is required";
    }

    if (!formData.type_id) {
      newErrors.type_id = "Design Type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // await onSave({ ...formData, id: design?.id });
      const dataToSend = { ...formData, id: design?.id };
      console.log("📤 Data yang dikirim:", dataToSend); // Tambahkan ini
      await onSave(dataToSend);
    } catch (error) {
      console.error("Error saving design:", error);
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
      title={design ? "Edit Design" : "New Design"}
      subtitle="Manage design codes and type classifications"
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
            label={loading ? "Saving..." : "Save Design"}
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
              Design Code
            </div>
          </Form.Label>
          <Input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange("code", e.target.value)}
            placeholder="Enter design code"
            error={!!errors.code}
          />
          <Form.Error>{errors.code}</Form.Error>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="type_id">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Design Type
            </div>
          </Form.Label>
          <DropdownServer
            apiService={searchDesignType}
            placeholder="Ketik untuk mencari design type..."
            onChange={(selectedId) => handleInputChange("type_id", selectedId)}
            value={formData.type_id}
            contentItem="name"
            valueKey="id" // ✅ Return hanya ID
            displayKey="name" // ✅ Tampilkan name di input
            name="type_id"
          />
          <Form.Error>{errors.type_id}</Form.Error>
        </Form.Group>
      </div>
    </Modal>
  );
}
