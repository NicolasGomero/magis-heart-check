import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Bullet = {
  id: string;
  title: string;
  content: string;
};

type Flashcard = {
  id: string;
  title: string;
  frontText: string;
  bullets: Bullet[];
};

const initialFlashcards: Flashcard[] = [
  {
    id: crypto.randomUUID(),
    title: "Pasaje 1",
    frontText:
      "Pega aquí un texto bíblico largo. Esta tarjeta está diseñada para soportar bastante contenido en la parte frontal.",
    bullets: [
      {
        id: crypto.randomUUID(),
        title: "Contexto",
        content: "Explicación sobre el contexto histórico y literario del pasaje.",
      },
      {
        id: crypto.randomUUID(),
        title: "Enseñanza central",
        content: "Comentario sobre el mensaje principal del texto.",
      },
    ],
  },
];

const FlashcardsPage = () => {
  const [cards, setCards] = useState<Flashcard[]>(initialFlashcards);
  const [activeSideByCard, setActiveSideByCard] = useState<Record<string, "front" | "back">>(
    Object.fromEntries(initialFlashcards.map((card) => [card.id, "front"]))
  );

  const updateCard = (cardId: string, updater: (card: Flashcard) => Flashcard) => {
    setCards((prev) => prev.map((card) => (card.id === cardId ? updater(card) : card)));
  };

  const addCard = () => {
    const id = crypto.randomUUID();
    setCards((prev) => [
      ...prev,
      {
        id,
        title: `Pasaje ${prev.length + 1}`,
        frontText: "",
        bullets: [{ id: crypto.randomUUID(), title: "Nuevo bullet", content: "" }],
      },
    ]);
    setActiveSideByCard((prev) => ({ ...prev, [id]: "front" }));
  };

  const addBullet = (cardId: string) => {
    updateCard(cardId, (card) => ({
      ...card,
      bullets: [...card.bullets, { id: crypto.randomUUID(), title: "Nuevo bullet", content: "" }],
    }));
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-10 md:p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Baraja de flashcards bíblicas</h1>
        <p className="text-muted-foreground">
          Cada tarjeta es grande para textos extensos. En la parte de atrás, los bullets se muestran por
          título y puedes desplegarlos para leer su explicación.
        </p>
        <Button onClick={addCard}>Agregar tarjeta</Button>
      </header>

      <section className="grid gap-8">
        {cards.map((card) => {
          const side = activeSideByCard[card.id] ?? "front";

          return (
            <Card key={card.id} className="min-h-[38rem] rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <Input
                  value={card.title}
                  onChange={(event) =>
                    updateCard(card.id, (existing) => ({ ...existing, title: event.target.value }))
                  }
                  className="max-w-sm text-lg font-semibold"
                />
                <div className="flex gap-2">
                  <Button
                    variant={side === "front" ? "default" : "outline"}
                    onClick={() =>
                      setActiveSideByCard((prev) => ({ ...prev, [card.id]: "front" }))
                    }
                  >
                    Frente
                  </Button>
                  <Button
                    variant={side === "back" ? "default" : "outline"}
                    onClick={() => setActiveSideByCard((prev) => ({ ...prev, [card.id]: "back" }))}
                  >
                    Reverso
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {side === "front" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Texto bíblico (frente)</p>
                    <Textarea
                      value={card.frontText}
                      onChange={(event) =>
                        updateCard(card.id, (existing) => ({ ...existing, frontText: event.target.value }))
                      }
                      placeholder="Pega aquí el pasaje bíblico completo..."
                      className="min-h-[28rem] resize-y text-base leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Bullets de comentario (solo títulos visibles por defecto)
                      </p>
                      <Button variant="secondary" onClick={() => addBullet(card.id)}>
                        Agregar bullet
                      </Button>
                    </div>

                    <Accordion type="multiple" className="w-full">
                      {card.bullets.map((bullet, index) => (
                        <AccordionItem key={bullet.id} value={bullet.id}>
                          <AccordionTrigger>{bullet.title || `Bullet ${index + 1}`}</AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-2">
                            <Input
                              value={bullet.title}
                              onChange={(event) =>
                                updateCard(card.id, (existing) => ({
                                  ...existing,
                                  bullets: existing.bullets.map((item) =>
                                    item.id === bullet.id ? { ...item, title: event.target.value } : item
                                  ),
                                }))
                              }
                              placeholder="Título del bullet"
                            />
                            <Textarea
                              value={bullet.content}
                              onChange={(event) =>
                                updateCard(card.id, (existing) => ({
                                  ...existing,
                                  bullets: existing.bullets.map((item) =>
                                    item.id === bullet.id ? { ...item, content: event.target.value } : item
                                  ),
                                }))
                              }
                              placeholder="Explicación de este bullet..."
                              className="min-h-32"
                            />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
};

export default FlashcardsPage;
