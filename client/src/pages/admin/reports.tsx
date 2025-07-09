import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth.tsx";
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Download, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const transactionData = [
  { name: 'Jan', amount: 2400 },
  { name: 'Fév', amount: 1398 },
  { name: 'Mar', amount: 9800 },
  { name: 'Avr', amount: 3908 },
  { name: 'Mai', amount: 4800 },
  { name: 'Juin', amount: 3800 },
  { name: 'Juil', amount: 4300 },
];

const clientData = [
  { name: 'Jan', count: 5 },
  { name: 'Fév', count: 8 },
  { name: 'Mar', count: 12 },
  { name: 'Avr', count: 15 },
  { name: 'Mai', count: 19 },
  { name: 'Juin', count: 25 },
  { name: 'Juil', count: 34 },
];

const verificationData = [
  { id: 1, client: 'Martin Dupont', montant: 750, date: '15/07/2023', etape: 'Étape 3/5' },
  { id: 2, client: 'Julie Tremblay', montant: 1250, date: '14/07/2023', etape: 'Étape 5/5' },
  { id: 3, client: 'Thomas Leroy', montant: 630, date: '14/07/2023', etape: 'Étape 2/5' },
  { id: 4, client: 'Clara Lefebvre', montant: 980, date: '12/07/2023', etape: 'Étape 4/5' },
  { id: 5, client: 'Hugo Martin', montant: 420, date: '11/07/2023', etape: 'Étape 1/5' },
];

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("transactions");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header isAdmin />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 md:ml-64">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Rapports et analyses</h2>
          
          <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
            <Card className="w-full md:w-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Type de rapport</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={reportType}
                  onValueChange={setReportType}
                >
                  <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactions">Transactions</SelectItem>
                    <SelectItem value="clients">Nouveaux clients</SelectItem>
                    <SelectItem value="verification">Vérifications</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            <Card className="w-full md:w-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Période</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full md:w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
            
            <Card className="w-full md:w-auto mt-auto">
              <CardContent className="pt-6">
                <Button variant="outline" className="w-full md:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter en PDF
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {reportType === "transactions" && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport de transactions</CardTitle>
                <CardDescription>
                  Rapport des transactions financières par mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transactionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#0c326f" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {reportType === "clients" && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport des nouveaux clients</CardTitle>
                <CardDescription>
                  Nombre de nouveaux clients inscrits par mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clientData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#0c326f" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {reportType === "verification" && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport des vérifications</CardTitle>
                <CardDescription>
                  Statut des vérifications en cours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant total</TableHead>
                      <TableHead>Date de début</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verificationData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.client}</TableCell>
                        <TableCell>€{item.montant.toFixed(2)}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.etape}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Détails
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <Sidebar isAdmin />
    </div>
  );
}