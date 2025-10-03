import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Category | Gridrr',
  description: 'Browse Website by categories',
};

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
