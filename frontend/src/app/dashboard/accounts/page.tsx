'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Table,
  Group,
  TextInput,
  ActionIcon,
  Menu,
  Badge,
  Switch,
  Button,
  Modal,
  Text,
  Select,
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconDotsVertical } from '@tabler/icons-react';
import { usePermissions } from '@/hooks/usePermissions';
import { notifications } from '@mantine/notifications';
import { profileApi } from '@/api/apiService';
import { ProfileData } from '@/types';

export default function AccountsPage() {
  const { canEdit, canDelete } = usePermissions();
  const [accounts, setAccounts] = useState<ProfileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<ProfileData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleUpdateAccount = async (id: string, updates: Partial<ProfileData>) => {
    try {
      const response = await profileApi.updateUser(id, updates);
      if (response.ok) {
        notifications.show({
          title: 'Thành công',
          message: 'Cập nhật tài khoản thành công',
          color: 'green',
        });
        // Refresh accounts list
        fetchAccounts();
        setIsEditModalOpen(false);
      }
    } catch (error) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể cập nhật tài khoản',
        color: 'red',
      });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;

    try {
      const response = await profileApi.deleteUser(id);

      if (response.ok) {
        notifications.show({
          title: 'Thành công',
          message: 'Xóa tài khoản thành công',
          color: 'green',
        });
        // Refresh accounts list
        fetchAccounts();
      }
    } catch (error) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể xóa tài khoản',
        color: 'red',
      });
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await profileApi.getAllUsers();
      setAccounts(response);
    } catch (error) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải danh sách tài khoản',
        color: 'red',
      });
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container size="lg" mt="md">
      <Title order={2} mb="md">Quản lý tài khoản</Title>

      <TextInput
        placeholder="Tìm kiếm theo tên, email..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.currentTarget.value)}
        mb="md"
      />

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Tên</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Loại tài khoản</Table.Th>
            <Table.Th>Vai trò</Table.Th>
            <Table.Th>Trạng thái</Table.Th>
            <Table.Th>Thao tác</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredAccounts.map((account) => (
            <Table.Tr key={account.id}>
              <Table.Td>{account.id}</Table.Td>
              <Table.Td>{account.name}</Table.Td>
              <Table.Td>{account.email}</Table.Td>
              <Table.Td>{account.account_type}</Table.Td>
              <Table.Td>
                <Badge color={account.role === 'ADMIN' ? 'blue' : 'green'}>
                  {account.role}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge color={account.is_active ? 'green' : 'red'}>
                  {account.is_active ? 'Hoạt động' : 'Vô hiệu'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Menu position="bottom-end" withArrow>
                  <Menu.Target>
                    <ActionIcon variant="subtle">
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {canEdit() && (
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Chỉnh sửa
                      </Menu.Item>
                    )}
                    {canDelete() && (
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        Xóa
                      </Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa tài khoản"
      >
        {selectedAccount && (
          <div>
            <TextInput
              label="Tên"
              value={selectedAccount.name}
              onChange={(e) =>
                setSelectedAccount({
                  ...selectedAccount,
                  name: e.currentTarget.value,
                })
              }
              mb="sm"
            />
            <TextInput
              label="Email"
              value={selectedAccount.email}
              onChange={(e) =>
                setSelectedAccount({
                  ...selectedAccount,
                  email: e.currentTarget.value,
                })
              }
              mb="sm"
            />
            <Select
              label="Loại tài khoản"
              value={selectedAccount.account_type}
              onChange={(value) =>
                setSelectedAccount({
                  ...selectedAccount,
                  account_type: value || '',
                })
              }
              data={['Personal', 'Business']}
              mb="sm"
            />
            <Select
              label="Vai trò"
              value={selectedAccount.role}
              onChange={(value: any) =>
                setSelectedAccount({
                  ...selectedAccount,
                  role: value,
                })
              }
              data={[
                { value: 'ADMIN', label: 'Admin' },
                { value: 'USER', label: 'User' },
                { value: 'TEACHER', label: 'Teacher' },
              ]}
              mb="sm"
            />
            <Switch
              label="Hoạt động"
              checked={selectedAccount.is_active}
              onChange={(e) =>
                setSelectedAccount({
                  ...selectedAccount,
                  is_active: e.currentTarget.checked,
                })
              }
              mb="md"
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={() =>
                  handleUpdateAccount(selectedAccount.id, selectedAccount)
                }
              >
                Lưu thay đổi
              </Button>
            </Group>
          </div>
        )}
      </Modal>
    </Container>
  );
}
