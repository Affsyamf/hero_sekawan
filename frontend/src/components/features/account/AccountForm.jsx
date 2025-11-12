import React, { useState, useEffect } from "react";
import { BookOpen, Hash, Tag, Save, Users, Search } from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";
import Table from "../../ui/table/Table";
import { searchAccount } from "../../../services/account_service";
import {
  searchAccountParent,
  getAccountParentById,
} from "../../../services/account_service";

function AccountPickerModal({ isOpen, onClose, onSelect }) {
  const columns = [
    { key: "account_no", label: "No. Akun", sortable: true },
    { key: "account_type", label: "Tipe Akun", sortable: true },
  ];

  // aksi pilih
  const renderActions = (row) => (
    <Button
      onClick={() => {
        console.log("Row selected:", row);
        onSelect({
          id: row.id,
          account_no: row.account_no,
          name: row.name,
        });
      }}
      label="Pilih"
      className="!py-1 !px-2"
    />
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pilih Induk Akun" size="lg">
      <div style={{ minHeight: "60vh" }}>
        <Table
          columns={columns}
          fetchData={searchAccountParent}
          actions={renderActions}
          pageSizeOptions={[5, 10, 25]}
          showDateRangeFilter={false}
        />
      </div>
    </Modal>
  );
}

export default function AccountForm({
  account = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [parentAccountDisplay, setParentAccountDisplay] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (account) {
        setFormData({
          name: account.name || "",
          parent_id: account.parent_id || "",
        });

        if (account.parent_id) {
          findAndSetParentDisplay(account.parent_id);
        } else {
          setParentAccountDisplay("");
        }
      } else {
        setFormData({
          name: "",
          parent_id: "",
        });
        setParentAccountDisplay("");
      }
    }
  }, [isOpen, account]);

  const findAndSetParentDisplay = async (id) => {
    if (!id) {
      setParentAccountDisplay("");
      return;
    }
    try {
      const response = await searchAccount({ page: 1, pageSize: 1000 });
      console.log("🔍 searchAccount response:", response);

      const rows = response?.data?.data || []; // ✅ ambil array akun dari response.data.data
      const parent = rows.find((a) => a.id === id);

      if (parent) {
        setParentAccountDisplay(`${parent.account_no} - ${parent.name}`);
      } else {
        setParentAccountDisplay(id);
      }
    } catch (e) {
      console.error("Gagal mencari nama parent:", e);
      setParentAccountDisplay(id);
    }
  };

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

    if (!formData.parent_id) {
      newErrors.parent_id = "Induk Akun harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectParent = (selectedAccount) => {
    setFormData((prev) => ({ ...prev, parent_id: selectedAccount.id }));
    setParentAccountDisplay(
      `${selectedAccount.account_no} - ${selectedAccount.name}`
    );

    if (errors.parent_id) {
      setErrors((prev) => ({ ...prev, parent_id: null }));
    }
    setIsPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dataToSave = {
      ...formData,
      id: account?.id
        ? parseInt(account.id.toString().split("_")[0])
        : undefined,
      parent_id: parseInt(formData.parent_id),
    };

    console.log("🛰️ Data to send:", dataToSave);

    if (isNaN(dataToSave.parent_id)) {
      setErrors((prev) => ({
        ...prev,
        parent_id: "Nomor Akun harus memiliki nomor yang benar",
      }));
      return;
    }

    setLoading(true);
    try {
      await onSave(dataToSave);
    } catch (error) {
      console.error("Error saving account:", error);
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

  // dimatikan dlu

  // const AccountType = {
  //   Goods: "goods",
  //   Service: "service",
  // };

  return (
    <>
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
          {account && (
            <Form.Group>
              <Form.Label htmlFor="account_no">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  Account Number (Auto-generated)
                </div>
              </Form.Label>
              <Input
                id="account_no"
                type="text"
                value={account.account_no || "N/A"}
                disabled
                className="bg-surface-secondary"
              />
            </Form.Group>
          )}

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
            <Form.Label htmlFor="parent_id_display" required>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary" />
                Induk Akun (Parent)
              </div>
            </Form.Label>
            <div className="flex space-x-2">
              <Input
                id="parent_id_display"
                type="text"
                value={parentAccountDisplay}
                placeholder="Pilih induk akun..."
                readOnly
                className="w-full !cursor-default bg-surface-secondary"
                error={!!errors.parent_id}
              />
              <Button
                icon={Search}
                label="Pilih"
                onClick={() => setIsPickerOpen(true)}
                disabled={loading}
                className="flex-shrink-0"
              />
            </div>
            <Form.Error>{errors.parent_id}</Form.Error>
          </Form.Group>
        </div>
      </Modal>

      <AccountPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectParent}
      />
    </>
  );
}
