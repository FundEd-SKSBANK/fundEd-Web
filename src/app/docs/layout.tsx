import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Documentation — FundEd',
    description: 'Admin guides, onboarding, and documentation for FundEd.',
};

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
