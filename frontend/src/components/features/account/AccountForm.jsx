import React, { useState, useEffect } from "react";
import { BookOpen, Hash, FileText, Tag, Save } from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";

export default function AccountForm({
  account = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: "",
    account_no: "",
    alias: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (account) {
        setFormData({
          name: account.name || "",
          account_no: account.account_no || "",
          alias: account.alias || "",
        });
      } else {
        setFormData({
          name: "",
          account_no: "",
          alias: "",
        });
      }
    }
  }, [isOpen, account]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Account Name is required";
    }

    if (!formData.account_no) {
      newErrors.account_no = "Account Number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({ ...formData, id: account?.id });
    } catch (error) {
      console.error("Error saving account:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? "Edit Account" : "New Account"}
      subtitle="Manage chart of accounts"
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
            label={loading ? "Saving..." : "Save Account"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-4">
        <Form.Group>
          <Form.Label htmlFor="account_no" required>
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-primary" />
              Account Number
            </div>
          </Form.Label>
          <Input
            id="account_no"
            type="number"
            value={formData.account_no}
            onChange={(e) => handleInputChange("account_no", e.target.value)}
            placeholder="Enter account number"
            error={!!errors.account_no}
          />
          <Form.Error>{errors.account_no}</Form.Error>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="name" required>
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Account Name
            </div>
          </Form.Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter account name"
            error={!!errors.name}
          />
          <Form.Error>{errors.name}</Form.Error>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="alias">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-primary" />
              Alias
            </div>
          </Form.Label>
          <Input
            id="alias"
            type="text"
            value={formData.alias}
            onChange={(e) => handleInputChange("alias", e.target.value)}
            placeholder="Enter account alias (optional)"
          />
        </Form.Group>
      </div>
    </Modal>
  );
}
