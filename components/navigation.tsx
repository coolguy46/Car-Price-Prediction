// components/NavigationHeader.tsx
import Link from 'next/link';
import { ReactNode } from 'react'; // Import ReactNode for children
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'; // Import from shadcn/ui

interface NavItem {
  name: string;
  path: string;
}

interface NavigationHeaderProps {
  children?: ReactNode; // Define children prop
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/' },
  { name: 'Model Performance', path: '/model' },
];

// Define the component with children
const NavigationHeader = ({ children }: NavigationHeaderProps) => {
  return (
    <header className="bg-gray-400 py-4">
      <nav className="container mx-auto px-4">
        <NavigationMenu>
          <NavigationMenuList className="flex space-x-4">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.path}>
                <Link href={item.path} legacyBehavior passHref>
                  <NavigationMenuLink
                    className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        {children} {/* Render children here */}
      </nav>
    </header>
  );
};

export default NavigationHeader;