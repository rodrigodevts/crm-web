import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Section } from './section';

export function PrimitivesData() {
  return (
    <Section id="primitivos-data" title="Data display">
      <div>
        <h3 className="mb-3 text-base font-medium">Avatar</h3>
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src="/nonexistent.png" alt="Maria Atendente" />
            <AvatarFallback>MA</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>RA</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Separator</h3>
        <div className="flex flex-col gap-2">
          <span>Acima</span>
          <Separator />
          <span>Abaixo</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tabs</h3>
        <Tabs defaultValue="one" className="w-full">
          <TabsList>
            <TabsTrigger value="one">Tab 1</TabsTrigger>
            <TabsTrigger value="two">Tab 2</TabsTrigger>
            <TabsTrigger value="three">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Conteúdo da tab 1</TabsContent>
          <TabsContent value="two">Conteúdo da tab 2</TabsContent>
          <TabsContent value="three">Conteúdo da tab 3</TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Breadcrumb</h3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Configurações</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Design System</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Table</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Maria</TableCell>
                <TableCell>maria@example.com</TableCell>
                <TableCell>Ativo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>João</TableCell>
                <TableCell>joao@example.com</TableCell>
                <TableCell>Ausente</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </Section>
  );
}
