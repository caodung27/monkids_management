import { Card, Text, Group, rem } from '@mantine/core';
import { IconProps } from '@tabler/icons-react';

interface StatsCardProps {
  icon: React.ComponentType<IconProps>;
  title: string;
  value: string;
  color: string;
  subtitle: string;
  diff: number;
}

export function StatsCard({ icon: Icon, title, value, color, subtitle, diff }: StatsCardProps) {
  return (
    <Card withBorder p="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        <Icon style={{ width: rem(22), height: rem(22) }} stroke={1.5} />
      </Group>

      <Group align="flex-end" gap="xs" mt={25}>
        <Text fw={700} fz="xl">
          {value}
        </Text>
        <Text c={diff >= 0 ? 'teal' : 'red'} fw={700} size="sm">
          {diff >= 0 ? '+' : ''}{diff}%
        </Text>
      </Group>

      <Text fz="xs" c="dimmed" mt={7}>
        {subtitle}
      </Text>
    </Card>
  );
} 