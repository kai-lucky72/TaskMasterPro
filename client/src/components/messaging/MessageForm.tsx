import { useState } from "react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface MessageFormProps {
  onSendMessage: (content: string) => void;
  isSubmitting: boolean;
}

export default function MessageForm({ onSendMessage, isSubmitting }: MessageFormProps) {
  // Form schema
  const formSchema = z.object({
    content: z.string().min(1, "Message cannot be empty")
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: ''
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSendMessage(values.content);
    form.reset();
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex items-end gap-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Type your message..." 
                  className="min-h-[40px] resize-none"
                  onInput={handleInput}
                  rows={1}
                  maxRows={4}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          size="icon" 
          className="flex-shrink-0" 
          disabled={isSubmitting}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
