import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { BarChart3 } from "lucide-react";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análises e relatórios detalhados</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Relatórios em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Sistema de relatórios em construção
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
